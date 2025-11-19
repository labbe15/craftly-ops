// Workflow Engine for Craftly Ops
// Handles automation workflows (triggers + actions)

import { supabase } from "@/integrations/supabase/client";

// Workflow structure
export interface WorkflowTrigger {
  type: "quote_status_changed" | "invoice_status_changed" | "project_status_changed" | "client_created" | "scheduled";
  config?: any;
}

export interface WorkflowAction {
  type: "send_email" | "create_project" | "update_status" | "add_tag" | "create_task" | "send_notification";
  config: any;
}

export interface Workflow {
  id?: string;
  name: string;
  description?: string;
  active: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
}

class WorkflowService {
  // Execute a workflow
  async executeWorkflow(workflow: Workflow, triggerData: any): Promise<boolean> {
    if (!workflow.active) {
      console.log(`Workflow ${workflow.name} is not active, skipping`);
      return false;
    }

    console.log(`Executing workflow: ${workflow.name}`);

    try {
      // Execute each action in sequence
      for (const action of workflow.actions) {
        await this.executeAction(action, triggerData);
      }

      // Log execution
      await this.logExecution(workflow, triggerData, "success");
      return true;
    } catch (error) {
      console.error(`Workflow execution error:`, error);
      await this.logExecution(workflow, triggerData, "failed", error);
      return false;
    }
  }

  // Execute a single action
  private async executeAction(action: WorkflowAction, context: any): Promise<void> {
    console.log(`Executing action: ${action.type}`, action.config);

    switch (action.type) {
      case "send_email":
        await this.actionSendEmail(action.config, context);
        break;

      case "create_project":
        await this.actionCreateProject(action.config, context);
        break;

      case "update_status":
        await this.actionUpdateStatus(action.config, context);
        break;

      case "add_tag":
        await this.actionAddTag(action.config, context);
        break;

      case "create_task":
        await this.actionCreateTask(action.config, context);
        break;

      case "send_notification":
        await this.actionSendNotification(action.config, context);
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  // ACTION: Send email
  private async actionSendEmail(config: any, context: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get recipient email from context or config
    const to = config.to || context.client?.email || context.email;
    if (!to) {
      console.warn("No recipient email found");
      return;
    }

    // Replace variables in subject and body
    const subject = this.replaceVariables(config.subject || "Notification", context);
    const body = this.replaceVariables(config.body || "", context);

    // Log email in mail_log (in production would send via email service)
    const { error } = await supabase.from("mail_log").insert({
      org_id: user.id,
      to_email: to,
      subject,
      body,
      template_key: "workflow_email",
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    if (error) throw error;
    console.log(`Email queued to: ${to}`);
  }

  // ACTION: Create project
  private async actionCreateProject(config: any, context: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get next project number
    const { count } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true });

    const projectNumber = `PROJ-${String((count || 0) + 1).padStart(4, "0")}`;

    const projectData = {
      org_id: user.id,
      number: projectNumber,
      name: this.replaceVariables(config.name || "Nouveau projet", context),
      client_id: context.client_id || context.quote?.client_id,
      status: config.status || "lead",
      priority: config.priority || "medium",
      description: config.description ? this.replaceVariables(config.description, context) : null,
    };

    const { error } = await supabase.from("projects").insert(projectData);
    if (error) throw error;

    console.log(`Project created: ${projectNumber}`);
  }

  // ACTION: Update status
  private async actionUpdateStatus(config: any, context: any): Promise<void> {
    const { entityType, entityId, newStatus } = config;

    if (!entityType || !entityId || !newStatus) {
      console.warn("Missing required fields for update_status");
      return;
    }

    const tableName = entityType === "quote" ? "quotes" : entityType === "invoice" ? "invoices" : "projects";

    const { error } = await supabase
      .from(tableName)
      .update({ status: newStatus })
      .eq("id", this.replaceVariables(entityId, context));

    if (error) throw error;
    console.log(`Updated ${entityType} status to: ${newStatus}`);
  }

  // ACTION: Add tag
  private async actionAddTag(config: any, context: any): Promise<void> {
    const { entityType, entityId, tag } = config;

    if (!entityType || !entityId || !tag) {
      console.warn("Missing required fields for add_tag");
      return;
    }

    const tableName = entityType === "project" ? "projects" : entityType === "client" ? "clients" : "quotes";
    const id = this.replaceVariables(entityId, context);

    // Get current entity
    const { data: entity, error: fetchError } = await supabase
      .from(tableName)
      .select("tags")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const currentTags = entity.tags || [];
    const newTags = [...new Set([...currentTags, tag])]; // Add tag if not exists

    const { error } = await supabase
      .from(tableName)
      .update({ tags: newTags })
      .eq("id", id);

    if (error) throw error;
    console.log(`Tag "${tag}" added to ${entityType}`);
  }

  // ACTION: Create task
  private async actionCreateTask(config: any, context: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const taskData = {
      org_id: user.id,
      project_id: context.project_id || context.project?.id,
      title: this.replaceVariables(config.title || "Nouvelle tâche", context),
      description: config.description ? this.replaceVariables(config.description, context) : null,
      status: config.status || "todo",
      priority: config.priority || "medium",
    };

    const { error } = await supabase.from("project_tasks").insert(taskData);
    if (error) throw error;

    console.log(`Task created: ${taskData.title}`);
  }

  // ACTION: Send notification
  private async actionSendNotification(config: any, context: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const notificationData = {
      org_id: user.id,
      user_id: config.user_id || user.id,
      title: this.replaceVariables(config.title || "Notification", context),
      message: this.replaceVariables(config.message || "", context),
      type: config.notificationType || "info",
      read: false,
    };

    const { error } = await supabase.from("notifications").insert(notificationData);
    if (error) throw error;

    console.log(`Notification sent: ${notificationData.title}`);
  }

  // Replace variables in text (e.g., {{client.name}}, {{quote.number}})
  private replaceVariables(text: string, context: any): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  // Get nested object value by path (e.g., "client.name")
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, prop) => current?.[prop], obj);
  }

  // Log workflow execution
  private async logExecution(workflow: Workflow, triggerData: any, status: "success" | "failed", error?: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.from("workflow_executions").insert({
        org_id: user.id,
        workflow_id: workflow.id,
        status,
        trigger_data: triggerData,
        error_message: error ? String(error) : null,
        executed_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error("Failed to log workflow execution:", logError);
    }
  }

  // Check and execute workflows based on trigger
  async checkTrigger(triggerType: string, triggerData: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch active workflows matching this trigger type
    const { data: workflows, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("active", true)
      .contains("trigger", { type: triggerType });

    if (error) {
      console.error("Error fetching workflows:", error);
      return;
    }

    // Execute matching workflows
    for (const workflow of workflows || []) {
      await this.executeWorkflow(workflow, triggerData);
    }
  }
}

export const workflowService = new WorkflowService();

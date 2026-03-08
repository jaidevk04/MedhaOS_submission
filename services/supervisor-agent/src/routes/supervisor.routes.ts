import { Router, Request, Response } from 'express';
import { SupervisorService } from '../services/supervisor.service';
import { AgentType } from '../types';

const router = Router();
const supervisorService = new SupervisorService();

/**
 * POST /api/supervisor/events
 * Process a new event
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    const result = await supervisorService.processEvent(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing event:', error);
    res.status(500).json({
      error: 'Failed to process event',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/supervisor/workflows/:workflowId
 * Get workflow status
 */
router.get('/workflows/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const workflow = await supervisorService.getWorkflowStatus(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.status(200).json(workflow);
  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({
      error: 'Failed to get workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/supervisor/workflows/:workflowId
 * Cancel workflow
 */
router.delete('/workflows/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    await supervisorService.cancelWorkflow(workflowId);
    res.status(200).json({ message: 'Workflow cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling workflow:', error);
    res.status(500).json({
      error: 'Failed to cancel workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/supervisor/agents
 * Get all available agents
 */
router.get('/agents', (req: Request, res: Response) => {
  try {
    const agents = supervisorService.getAvailableAgents();
    res.status(200).json(agents);
  } catch (error) {
    console.error('Error getting agents:', error);
    res.status(500).json({
      error: 'Failed to get agents',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/supervisor/agents/:agentType
 * Get specific agent details
 */
router.get('/agents/:agentType', (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const agent = supervisorService.getAgent(agentType as AgentType);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.status(200).json(agent);
  } catch (error) {
    console.error('Error getting agent:', error);
    res.status(500).json({
      error: 'Failed to get agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/supervisor/agents/:agentType/health
 * Update agent health status
 */
router.put('/agents/:agentType/health', (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const { status } = req.body;

    if (!['healthy', 'degraded', 'unavailable'].includes(status)) {
      return res.status(400).json({ error: 'Invalid health status' });
    }

    supervisorService.updateAgentHealth(agentType as AgentType, status);
    res.status(200).json({ message: 'Agent health updated successfully' });
  } catch (error) {
    console.error('Error updating agent health:', error);
    res.status(500).json({
      error: 'Failed to update agent health',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/supervisor/patients/:patientId/context
 * Get patient context
 */
router.get('/patients/:patientId/context', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const context = await supervisorService.getPatientContext(patientId);
    
    if (!context) {
      return res.status(404).json({ error: 'Patient context not found' });
    }

    res.status(200).json(context);
  } catch (error) {
    console.error('Error getting patient context:', error);
    res.status(500).json({
      error: 'Failed to get patient context',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/supervisor/patients/:patientId/workflows
 * Get active workflows for patient
 */
router.get('/patients/:patientId/workflows', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const workflows = await supervisorService.getActiveWorkflows(patientId);
    res.status(200).json(workflows);
  } catch (error) {
    console.error('Error getting patient workflows:', error);
    res.status(500).json({
      error: 'Failed to get patient workflows',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/supervisor/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await supervisorService.healthCheck();
    res.status(200).json(health);
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

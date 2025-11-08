import { Router, Request, Response } from 'express';
import { statusCalculator } from '../services/status-calculator.service.js';
import { waterDataService } from '../services/water-data.service.js';
import { communityIssuesService } from '../services/community-issues.service.js';
import { faqService } from '../services/faq.service.js';
import { notificationsService } from '../services/notifications.service.js';
import { userEmailsService } from '../services/user-emails.service.js';
import { userPreferencesService } from '../services/user-preferences.service.js';
import { ErrorHandler } from '../middleware/error-handler.middleware.js';

const router = Router();

router.get('/status', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const status = statusCalculator.getPublicStatus();
  res.json({
    success: true,
    data: {
      overallRisk: {
        index: status.overallRisk.index,
        level: status.overallRisk.level,
        description: status.overallRisk.description,
        timestamp: status.overallRisk.timestamp,
      },
      chemicals: status.chemicals.map((chem) =>
        statusCalculator.formatChemicalReading(chem)
      ),
      healthAdvisory: status.healthAdvisory,
      lastUpdated: status.lastUpdated,
    },
  });
}));

router.get('/risk-index', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const riskIndex = waterDataService.getWaterRiskIndex();
  res.json({
    success: true,
    data: {
      index: riskIndex.index,
      level: riskIndex.level,
      description: riskIndex.description,
      timestamp: riskIndex.timestamp,
      color: statusCalculator.getRiskLevelColor(riskIndex.level),
      badgeText: statusCalculator.getStatusBadgeText(riskIndex.level),
    },
  });
}));

router.get('/chemicals', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const currentState = waterDataService.getCurrentState();
  res.json({
    success: true,
    data: currentState.chemicals.map((chem) =>
      statusCalculator.formatChemicalReading(chem)
    ),
  });
}));

router.get('/health-advisory', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const status = statusCalculator.getPublicStatus();
  res.json({
    success: true,
    data: status.healthAdvisory,
  });
}));

router.post('/demo/attack', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const { scenarioId } = req.body;
  
  if (!scenarioId) {
    res.status(400).json({
      success: false,
      error: 'scenarioId is required',
    });
    return;
  }

  const success = waterDataService.triggerAttack(scenarioId);
  
  if (!success) {
    res.status(404).json({
      success: false,
      error: 'Attack scenario not found',
    });
    return;
  }

  res.json({
    success: true,
    message: `Attack scenario '${scenarioId}' triggered`,
  });
}));

router.post('/demo/reset', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  waterDataService.resetToBaseline();
  res.json({
    success: true,
    message: 'System reset to normal baseline',
  });
}));

router.get('/demo/scenarios', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const scenarios = waterDataService.getAttackScenarios();
  res.json({
    success: true,
    data: scenarios,
  });
}));

router.get('/history', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const limit = days * 24;
  const history = waterDataService.getHistory(limit);
  
  const formattedHistory = history.map((point) => ({
    timestamp: point.timestamp,
    riskIndex: point.riskIndex,
    chemicals: point.chemicals.map((chem) => ({
      parameter: chem.parameter,
      value: chem.value,
      unit: chem.unit,
      status: chem.status,
    })),
  }));
  
  res.json({
    success: true,
    data: formattedHistory,
  });
}));

router.post('/report-issue', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const { issueType, description, location, priority, contactEmail, contactPhone } = req.body;

  if (!issueType || !description || !location || !priority) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields: issueType, description, location, priority',
    });
    return;
  }

  const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
  if (!validPriorities.includes(priority)) {
    res.status(400).json({
      success: false,
      error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
    });
    return;
  }

  const issue = communityIssuesService.submitIssue({
    issueType,
    description,
    location,
    priority,
    contactEmail,
    contactPhone,
  });

  res.status(201).json({
    success: true,
    data: issue,
    message: 'Issue reported successfully',
  });
}));

router.get('/faq', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const categoryId = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;

  if (categoryId) {
    const category = faqService.getFAQByCategory(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        error: `FAQ category '${categoryId}' not found`,
      });
      return;
    }
    res.json({
      success: true,
      data: category,
    });
    return;
  }

  if (search) {
    const results = faqService.searchFAQs(search);
    res.json({
      success: true,
      data: {
        searchTerm: search,
        results,
        count: results.length,
      },
    });
    return;
  }

  const allFAQs = faqService.getAllFAQs();
  res.json({
    success: true,
    data: {
      categories: allFAQs,
      count: allFAQs.reduce((sum, cat) => sum + cat.questions.length, 0),
    },
  });
}));

router.post('/register-email', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const { email, userId } = req.body;

  if (!email || !userId) {
    res.status(400).json({
      success: false,
      error: 'Email and userId are required',
    });
    return;
  }

  const userEmail = userEmailsService.upsertUserEmail(email, userId);

  const existingPreferences = userPreferencesService.getPreferences(userId);
  if (!existingPreferences) {
    userPreferencesService.savePreferences(userId, email, {
      waterQualityAlerts: true,
      systemUpdates: true,
      maintenanceNotices: false,
      emailNotifications: true,
      pushNotifications: true,
    });
  }

  res.json({
    success: true,
    data: userEmail,
    message: 'Email registered successfully',
  });
}));

router.get('/notifications', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const notifications = notificationsService.getAllNotifications(limit);

  res.json({
    success: true,
    data: notifications,
    count: notifications.length,
  });
}));

router.get('/notifications/unread-count', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const count = notificationsService.getUnreadCount();

  res.json({
    success: true,
    data: { count },
  });
}));

router.get('/notifications/:id', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid notification ID',
    });
    return;
  }

  try {
    const notification = notificationsService.getNotificationById(id);
    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Notification not found',
    });
  }
}));

router.patch('/notifications/:id/read', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid notification ID',
    });
    return;
  }

  try {
    const notification = notificationsService.markAsRead(id);
    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Notification not found',
    });
  }
}));

router.patch('/notifications/read-all', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const count = notificationsService.markAllAsRead();

  res.json({
    success: true,
    data: { count },
    message: `${count} notifications marked as read`,
  });
}));

router.delete('/notifications/:id', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid notification ID',
    });
    return;
  }

  const deleted = notificationsService.deleteNotification(id);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Notification not found',
    });
    return;
  }

  res.json({
    success: true,
    message: 'Notification deleted',
  });
}));

router.get('/preferences', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required',
    });
    return;
  }

  const preferences = userPreferencesService.getPreferences(userId);

  if (!preferences) {
    res.json({
      success: true,
      data: null,
      message: 'No preferences found. Using defaults.',
    });
    return;
  }

  res.json({
    success: true,
    data: preferences,
  });
}));

router.put('/preferences', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const { userId, email, preferences } = req.body;

  if (!userId || !email) {
    res.status(400).json({
      success: false,
      error: 'userId and email are required',
    });
    return;
  }

  if (!preferences || typeof preferences !== 'object') {
    res.status(400).json({
      success: false,
      error: 'preferences object is required',
    });
    return;
  }

  const savedPreferences = userPreferencesService.savePreferences(userId, email, preferences);

  res.json({
    success: true,
    data: savedPreferences,
    message: 'Preferences saved successfully',
  });
}));

export default router;


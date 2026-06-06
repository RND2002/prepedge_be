import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as interviewService from './interview.service';
import { ErrorCodes, ErrorMessages } from '../lib/errors';
import fs from 'fs';

export const startInterview = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  try {
    const userId = (req as any).user.sub;
    const session = await interviewService.startInterview(userId, req.body);
    res.status(202).json(session);
  } catch (error: any) {
    if (error.message === 'ACTIVE_SESSION_EXISTS') {
      // Build a quick context response
      return res.status(409).json({
        success: false,
        error: "ACTIVE_SESSION_EXISTS",
        humanMessage: "Finish your current interview first",
        resumeContext: {
          sessionId: error.activeSessionId,
          resumeUrl: `/interview/session/${error.activeSessionId}`
        }
      });
    }
    if (error.message === 'DAILY_LIMIT_REACHED') {
      return res.status(429).json({
        success: false,
        error: "DAILY_LIMIT_REACHED",
        humanMessage: "You've reached your daily limit of 2 new interviews. Come back tomorrow!"
      });
    }

    console.error('Start Interview Error:', error);
    fs.appendFileSync('error.log', new Date().toISOString() + ' ' + (error.stack || error.message) + '\n');
    res.status(500).json({ message: error.message || ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const saveAnswer = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = (req as any).user.sub;
    const result = await interviewService.saveAnswer(userId, req.body);
    res.status(200).json({ saved: true, answerId: result._id });
  } catch (error: any) {
    console.error('Save Answer Error:', error);
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const submitInterview = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = (req as any).user.sub;
    const { sessionId } = req.body;
    
    const result = await interviewService.submitInterview(userId, sessionId);
    
    res.status(202).json({ message: 'Evaluation started', session: result });
  } catch (error: any) {
    console.error('Submit Interview Error:', error);
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const getResults = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const sessionId = req.params.sessionId as string;
    const results = await interviewService.getSessionResults(userId, sessionId);
    res.status(200).json(results);
  } catch (error: any) {
    console.error('Get Results Error:', error);
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const getInterviewContext = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const context = await interviewService.getInterviewContext(userId);
    res.status(200).json({ success: true, data: context });
  } catch (error: any) {
    console.error('Get Interview Context Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const resumeInterview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const sessionId = req.params.sessionId as string;
    const result = await interviewService.resumeInterview(userId, sessionId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'SESSION_NOT_FOUND') return res.status(404).json({ error: 'SESSION_NOT_FOUND' });
    if (error.message === 'NOT_YOUR_SESSION') return res.status(403).json({ error: 'NOT_YOUR_SESSION' });
    if (error.message === 'SESSION_NOT_RESUMABLE') {
      return res.status(409).json({
        error: 'SESSION_NOT_RESUMABLE',
        status: error.status,
        hint: error.hint
      });
    }
    console.error('Resume Interview Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const abandonInterview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const sessionId = req.params.sessionId as string;
    const { reason } = req.body;
    const result = await interviewService.abandonInterview(userId, sessionId, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'SESSION_NOT_FOUND') return res.status(404).json({ error: 'SESSION_NOT_FOUND' });
    if (error.message === 'NOT_YOUR_SESSION') return res.status(403).json({ error: 'NOT_YOUR_SESSION' });
    if (error.message === 'SESSION_NOT_ABANDONABLE') return res.status(409).json({ error: 'SESSION_NOT_ABANDONABLE' });
    console.error('Abandon Interview Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await interviewService.getHistory(userId, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Get History Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const sessionId = req.params.sessionId as string;
    
    const { session } = await interviewService.getSessionResults(userId, sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (session.status === 'questions_generated') {
      return res.json({ status: session.status, evaluationStatus: 'processing', overallScore: null });
    } else if (session.status === 'in_progress') {
      // Done generating questions
      return res.json({ status: session.status, evaluationStatus: 'in_progress', overallScore: null });
    } else if (session.status === 'evaluating' || session.status === 'submitted') {
      return res.json({ status: session.status, evaluationStatus: 'processing', overallScore: null });
    } else if (session.status === 'completed') {
      return res.json({ status: session.status, evaluationStatus: 'complete', overallScore: session.results?.overallScore || null });
    } else {
      return res.json({ status: session.status, evaluationStatus: 'failed', overallScore: null });
    }
  } catch (error: any) {
    console.error('Get Status Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

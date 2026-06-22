import { NextFunction, Request, Response } from "express";
import * as service from "./doctorSchedules.service";

export async function getSchedules(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getSchedules(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function createSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.createSchedule(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function updateSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.updateSchedule(Number(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function updateScheduleStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await service.updateScheduleStatus(Number(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

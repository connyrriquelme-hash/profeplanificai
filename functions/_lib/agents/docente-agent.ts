import type { Env } from '../_middleware';

export interface TeacherCourse {
  id: string;
  course_code: string;
  course_name: string;
  level: string;
  created_at: string;
  student_count: number;
}

export interface TeacherStudent {
  id: string;
  name: string;
  course_id: string;
  observations: string;
  enrollment_date: string;
}

export interface TeacherReport {
  id: string;
  teacher_id: string;
  course_id: string;
  student_id: string;
  oa_id: string;
  student_score: number;
  max_score: number;
  grading_criteria: string;
  feedback: string;
  created_at: string;
}

export class DocenteAgent {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async getTeacherCourses(teacherId: string): Promise<TeacherCourse[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT c.id, c.course_code, c.course_name, c.level, c.created_at,
               COUNT(s.id) as student_count
       FROM cursos c
       LEFT JOIN estudiantes s ON s.course_id = c.id
       WHERE c.usuario_id = ?
       GROUP BY c.id, c.course_code, c.course_name, c.level, c.created_at
       ORDER BY c.created_at DESC`
    ).bind(teacherId).all();

    return results;
  }

  async getStudentsByCourse(courseId: string): Promise<TeacherStudent[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT s.id, s.name, s.course_id, s.observations, s.created_at as enrollment_date
       FROM estudiantes s
       WHERE s.course_id = ?
       ORDER BY s.name`
    ).bind(courseId).all();

    return results;
  }

  async getTeacherReports(
    teacherId: string,
    courseId?: string,
    studentId?: string
  ): Promise<TeacherReport[]> {
    let query = `
      SELECT r.id, r.teacher_id, r.course_id, r.student_id, r.oa_id,
             r.student_score, r.max_score, r.grading_criteria, r.feedback, r.created_at
      FROM eval_reports r
      WHERE r.teacher_id = ?
    `;
    const params: unknown[] = [teacherId];

    if (courseId) {
      query += ` AND r.course_id = ?`;
      params.push(courseId);
    }

    if (studentId) {
      query += ` AND r.student_id = ?`;
      params.push(studentId);
    }

    query += ` ORDER BY r.created_at DESC`;

    const { results } = await this.env.DB.prepare(query).bind(...params).all();
    return results;
  }

  async createStudentReport(
    teacherId: string,
    courseId: string,
    studentId: string,
    oaId: string,
    score: number,
    maxScore: number,
    gradingCriteria: string,
    feedback: string
  ): Promise<TeacherReport> {
    const reportId = `report-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await this.env.DB.prepare(
      `INSERT INTO eval_reports (
        id, teacher_id, course_id, student_id, oa_id,
        student_score, max_score, grading_criteria, feedback, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      reportId,
      teacherId,
      courseId,
      studentId,
      oaId,
      score,
      maxScore,
      gradingCriteria,
      feedback,
      now
    ).run();

    return {
      id: reportId,
      teacher_id: teacherId,
      course_id: courseId,
      student_id: studentId,
      oa_id: oaId,
      student_score: score,
      max_score: maxScore,
      grading_criteria: gradingCriteria,
      feedback: feedback,
      created_at: now,
    };
  }

  async getRecentActivities(teacherId: string, limit: number = 10): Promise<any[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT r.id, r.teacher_id, r.course_id, r.student_id, r.oa_id,
               r.student_score, r.max_score, r.grading_criteria, r.feedback, r.created_at,
               s.name as student_name, c.course_code, c.course_name
       FROM eval_reports r
       JOIN estudiantes s ON s.id = r.student_id
       JOIN cursos c ON c.id = r.course_id
       WHERE r.teacher_id = ?
       ORDER BY r.created_at DESC
       LIMIT ?`
    ).bind(teacherId, limit).all();

    return results;
  }

  async getStudentProgress(studentId: string): Promise<any> {
    const { results: reports } = await this.env.DB.prepare(
      `SELECT r.id, r.teacher_id, r.oa_id, r.student_score, r.max_score,
               r.grading_criteria, r.feedback, r.created_at,
               c.course_code, c.course_name, t.name as teacher_name
       FROM eval_reports r
       JOIN cursos c ON c.id = r.course_id
       JOIN usuarios t ON t.id = r.teacher_id
       WHERE r.student_id = ?
       ORDER BY r.created_at DESC`
    ).bind(studentId).all();

    const averageScore = reports.reduce((sum: number, r: any) => sum + (r.student_score / r.max_score * 100), 0) / (reports.length || 1);

    return {
      student_id: studentId,
      total_evaluations: reports.length,
      average_score: Number(averageScore.toFixed(1)),
      level: averageScore >= 85 ? 'Excelente' : averageScore >= 70 ? 'Bien' : averageScore >= 60 ? 'Satisfactorio' : 'Necesita mejoramiento',
      recent_reports: reports.slice(0, 5),
    };
  }
}
import { MockAcademicRecord } from '../types';

/**
 * SIMULATED UNIVERSITY VERIFICATION SERVICE
 * 
 * DISCLAIMER & PHASE 2 BOUNDARY:
 * This is an isolated hackathon mock service providing deterministic dummy
 * academic records for evaluation and demonstration.
 * - DOES NOT scrape real university portals.
 * - DOES NOT store or collect actual institutional passwords.
 * - DOES NOT claim to verify live production academic databases.
 */

export const MOCK_UNIVERSITY_RECORDS: Record<string, MockAcademicRecord> = {
  VIT20260001: {
    studentId: 'VIT20260001',
    studentName: 'Aarav Sharma',
    institution: 'Vellore Institute of Technology',
    department: 'Computer Science & Engineering',
    academicYear: 'Year 3 (2024-2027)',
    cgpa: 9.72,
    status: 'ACTIVE',
    meritTier: 'Tier 1',
    discountPercentage: 35
  },
  VIT20260002: {
    studentId: 'VIT20260002',
    studentName: 'Kavya Menon',
    institution: 'Vellore Institute of Technology',
    department: 'Electronics & Communication Engineering',
    academicYear: 'Year 4 (2023-2027)',
    cgpa: 9.50,
    status: 'ACTIVE',
    meritTier: 'Tier 1',
    discountPercentage: 30
  },
  VIT20260003: {
    studentId: 'VIT20260003',
    studentName: 'Rohan Deshmukh',
    institution: 'Vellore Institute of Technology',
    department: 'Mechanical Engineering',
    academicYear: 'Year 2 (2025-2028)',
    cgpa: 9.00,
    status: 'ACTIVE',
    meritTier: 'Tier 1',
    discountPercentage: 25
  },
  VIT20260004: {
    studentId: 'VIT20260004',
    studentName: 'Ananya Gupta',
    institution: 'Vellore Institute of Technology',
    department: 'Information Technology',
    academicYear: 'Year 3 (2024-2027)',
    cgpa: 8.50,
    status: 'ACTIVE',
    meritTier: 'Tier 2',
    discountPercentage: 20
  },
  VIT20260005: {
    studentId: 'VIT20260005',
    studentName: 'Siddharth Varma',
    institution: 'Vellore Institute of Technology',
    department: 'Civil Engineering',
    academicYear: 'Year 4 (2023-2027)',
    cgpa: 8.20,
    status: 'ACTIVE',
    meritTier: 'Tier 2',
    discountPercentage: 15
  }
};

export class MockUniversityService {
  /**
   * Look up a student by student ID in the simulated database
   */
  public async lookupRecord(studentId: string): Promise<MockAcademicRecord | null> {
    const normalizedId = studentId.trim().toUpperCase();
    const record = MOCK_UNIVERSITY_RECORDS[normalizedId];

    if (!record) {
      return null;
    }

    return { ...record };
  }

  /**
   * Get all supported simulated student records (for demo reference)
   */
  public getSampleStudentRecords(): MockAcademicRecord[] {
    return Object.values(MOCK_UNIVERSITY_RECORDS);
  }

  /**
   * Calculate merit discount tier based on CGPA
   */
  public calculateDiscountTier(cgpa: number): { tier: 'Tier 1' | 'Tier 2' | 'Standard'; percentage: number } {
    if (cgpa >= 9.0) {
      return { tier: 'Tier 1', percentage: cgpa >= 9.5 ? 35 : 30 };
    } else if (cgpa >= 8.0) {
      return { tier: 'Tier 2', percentage: cgpa >= 8.5 ? 20 : 15 };
    }
    return { tier: 'Standard', percentage: 0 };
  }
}

export const mockUniversityService = new MockUniversityService();

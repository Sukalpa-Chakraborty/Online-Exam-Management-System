export type UserRole = "student" | "teacher" | "admin";

export interface UserProfile {
    uid?: string;
    name?: string;
    email?: string;
    role: UserRole;

    // Basic information
    phone?: string;
    department?: string;

    // Student fields
    rollNumber?: string;
    semester?: string;
    collegeName?: string;

    // Teacher fields
    employeeId?: string;
    designation?: string;
    teacherCode?: string;

    // Profile image
    photoURL?: string;

    /** Application access flag. Auth accounts need the Firebase Admin SDK to be disabled. */
    status?: "active" | "disabled";
    createdAt?: { toDate?: () => Date };
}

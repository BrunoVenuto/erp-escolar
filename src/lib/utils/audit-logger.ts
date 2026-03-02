"use client";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

/**
 * Types of actions that should be audited for LGPD/Compliance
 */
export type AuditAction =
    | "STUDENT_CREATE"
    | "STUDENT_UPDATE"
    | "STUDENT_DELETE"
    | "STUDENT_ENROLL"
    | "CLASS_CREATE"
    | "CLASS_UPDATE"
    | "CLASS_DELETE"
    | "GRADE_UPDATE"
    | "ATTENDANCE_SAVE"
    | "DOC_UPLOAD"
    | "USER_ROLE_CHANGE";

interface AuditLog {
    action: AuditAction;
    userId: string; // The person doing the action
    userName: string;
    targetId: string; // ID of the student, grade, or document affected
    details: string;  // Human-readable description
    metadata?: any;
}

/**
 * Logs a critical action to Firestore for audit purposes.
 */
export async function logAudit(data: AuditLog) {
    try {
        await addDoc(collection(db, "audit_logs"), {
            ...data,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        // We don't want to block the UI if logging fails, but we should know
        console.error("Critical: Failed to log audit action:", err);
    }
}

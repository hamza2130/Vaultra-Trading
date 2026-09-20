// Hand-written until local Supabase is running and we can generate this from
// the real schema with:
//   npx supabase gen types typescript --local > src/lib/supabase/types.ts
// Keep this in sync with supabase/migrations/0001_init.sql until then.

export type UserRole = "user" | "admin";
export type KycStatus = "pending" | "approved" | "rejected" | "restricted";
export type DocType = "national_id" | "passport" | "student_card";
export type DepositStatus = "pending" | "approved" | "rejected";
export type WithdrawalStatus = "pending" | "fulfilled" | "rejected";

type NoRelationships = { Relationships: [] };

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string;
          full_name: string;
          role: UserRole;
          kyc_status: KycStatus;
          balance: number;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          full_name: string;
          role?: UserRole;
          kyc_status?: KycStatus;
          balance?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      } & NoRelationships;
      kyc_documents: {
        Row: {
          id: string;
          user_id: string;
          doc_type: DocType;
          storage_path: string;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          doc_type: DocType;
          storage_path: string;
          submitted_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["kyc_documents"]["Insert"]>;
      } & NoRelationships;
      email_blacklist: {
        Row: { email: string; reason: string | null; blacklisted_at: string };
        Insert: { email: string; reason?: string | null; blacklisted_at?: string };
        Update: Partial<Database["public"]["Tables"]["email_blacklist"]["Insert"]>;
      } & NoRelationships;
      blocked_ips: {
        Row: { ip: string; user_id: string | null; reason: string | null; blocked_at: string };
        Insert: { ip: string; user_id?: string | null; reason?: string | null; blocked_at?: string };
        Update: Partial<Database["public"]["Tables"]["blocked_ips"]["Insert"]>;
      } & NoRelationships;
      platform_wallets: {
        Row: { id: string; label: string; address: string; network: string; active: boolean; created_at: string };
        Insert: { id?: string; label: string; address: string; network?: string; active?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["platform_wallets"]["Insert"]>;
      } & NoRelationships;
      saved_withdrawal_addresses: {
        Row: { id: string; user_id: string; label: string; address: string; created_at: string };
        Insert: { id?: string; user_id: string; label: string; address: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["saved_withdrawal_addresses"]["Insert"]>;
      } & NoRelationships;
      deposit_requests: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          amount: number;
          proof_storage_path: string;
          deposit_address: string;
          status: DepositStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency: string;
          amount: number;
          proof_storage_path: string;
          deposit_address: string;
          status?: DepositStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deposit_requests"]["Insert"]>;
      } & NoRelationships;
      withdrawal_requests: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          amount: number;
          address_id: string | null;
          address: string;
          status: WithdrawalStatus;
          admin_proof_storage_path: string | null;
          reject_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency: string;
          amount: number;
          address_id?: string | null;
          address: string;
          status?: WithdrawalStatus;
          admin_proof_storage_path?: string | null;
          reject_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["withdrawal_requests"]["Insert"]>;
      } & NoRelationships;
      balance_ledger: {
        Row: {
          id: string;
          user_id: string;
          old_balance: number;
          new_balance: number;
          changed_by: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          old_balance: number;
          new_balance: number;
          changed_by: string;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["balance_ledger"]["Insert"]>;
      } & NoRelationships;
      user_ips: {
        Row: { user_id: string; ip: string; first_seen: string; last_seen: string };
        Insert: { user_id: string; ip: string; first_seen?: string; last_seen?: string };
        Update: Partial<Database["public"]["Tables"]["user_ips"]["Insert"]>;
      } & NoRelationships;
      activity_log: {
        Row: { id: string; user_id: string | null; type: string; detail: string; status: string; created_at: string };
        Insert: { id?: string; user_id?: string | null; type: string; detail: string; status: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: {
      approve_deposit: { Args: { p_request: string; p_admin: string }; Returns: undefined };
      reject_deposit: { Args: { p_request: string; p_admin: string }; Returns: undefined };
      fulfill_withdrawal: {
        Args: { p_request: string; p_admin: string; p_proof_path: string };
        Returns: undefined;
      };
      reject_withdrawal: {
        Args: { p_request: string; p_admin: string; p_reason: string };
        Returns: undefined;
      };
      set_balance: {
        Args: { p_user: string; p_new: number; p_note: string; p_admin: string };
        Returns: undefined;
      };
    };
  };
}

import { auth } from "./firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export interface ContentRecord {
  id: number;
  fingerprint: string;
  content_type: "text" | "image";
  title: string;
  description: string;
  owner_address: string;
  owner_email: string | null;
  tx_hash: string | null;
  ipfs_hash: string | null;
  ipfs_url: string | null;
  created_at: string;
  has_text: boolean;
  image_phash: string | null;
}

export interface RegisterResponse {
  status: string;
  fingerprint: string;
  tx_hash: string | null;
  ipfs_hash: string | null;
  ipfs_url: string | null;
  record: ContentRecord;
  blockchain_warning?: string;
  ipfs_warning?: string;
  etherscan_url?: string;
}

export interface PlagiarismMatch {
  fingerprint: string;
  title: string;
  owner: string;
  similarity_score: number;
  content_type: string;
  hamming_distance?: number;
  method?: "tfidf" | "semantic" | "phash" | "cnn";
  tfidf_score?: number;
  semantic_score?: number;
  phash_score?: number;
  cnn_score?: number;
}

export interface WebMatch {
  url: string;
  similarity_score: number;
  snippet: string;
  source_query: string;
}

export interface WebResults {
  queries_searched: number;
  pages_checked: number;
  matches: WebMatch[];
}

export interface PlagiarismResponse {
  fingerprint: string;
  exact_match: ContentRecord | null;
  similar_content: PlagiarismMatch[];
  web_results: WebResults | null;
  is_plagiarized: boolean;
}

export interface StatusResponse {
  status: string;
  blockchain_configured: boolean;
  blockchain_connected: boolean;
  firebase_configured: boolean;
  total_records: number;
}

export async function registerContent(formData: FormData): Promise<RegisterResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/register`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data;
}

export async function checkPlagiarism(formData: FormData): Promise<PlagiarismResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/check-plagiarism`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Check failed");
  return data;
}

export async function getRecords(): Promise<ContentRecord[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/records`, { headers });
  const data = await res.json();
  return data.records || [];
}

export async function getMyRecords(): Promise<ContentRecord[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/my-records`, { headers });
  const data = await res.json();
  return data.records || [];
}

export async function getStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/api/status`);
  return await res.json();
}

export async function verifyOnChain(fingerprint: string) {
  const res = await fetch(`${API_BASE}/api/verify/${fingerprint}`);
  return await res.json();
}

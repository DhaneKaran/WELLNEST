const BASE_URL = "https://yyczs4kole.execute-api.ap-south-1.amazonaws.com/dev";

export type Chat = { id: string; title?: string; createdAt?: string };
export type Document = { id: string; fileName: string; status: "PROCESSING" | "COMPLETED" | "FAILED" };
export type QueryResponse = { answer: string; sources?: string[] };

export const ragApi = {
  // ---- Chats ----
  createChat: async (title?: string): Promise<Chat> => {
    const res = await fetch(`${BASE_URL}/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to create chat");
    return res.json();
  },

  getChats: async (): Promise<Chat[]> => {
    const res = await fetch(`${BASE_URL}/chats`);
    if (!res.ok) throw new Error("Failed to fetch chats");
    return res.json();
  },

  getChatById: async (chatId: string): Promise<{ id: string; messages: any[] }> => {
    const res = await fetch(`${BASE_URL}/chats/${chatId}`);
    if (!res.ok) throw new Error("Failed to fetch chat");
    return res.json();
  },

  deleteChat: async (chatId: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/chats/${chatId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete chat");
  },

  // ---- Documents ----
  getUploadUrl: async (fileName: string, fileType: string): Promise<{ uploadUrl: string; documentId: string }> => {
    const res = await fetch(`${BASE_URL}/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileType }),
    });
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
  },

  getDocumentStatus: async (documentId: string): Promise<{ status: string; summary?: string }> => {
    const res = await fetch(`${BASE_URL}/status/${documentId}`);
    if (!res.ok) throw new Error("Failed to get status");
    return res.json();
  },

  listDocuments: async (): Promise<Document[]> => {
    const res = await fetch(`${BASE_URL}/documents`);
    if (!res.ok) throw new Error("Failed to list documents");
    return res.json();
  },

  // ---- Query ----
  query: async (chatId: string, question: string, documentId?: string): Promise<QueryResponse> => {
    const res = await fetch(`${BASE_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, question, documentId }),
    });
    if (!res.ok) throw new Error("Query failed");
    return res.json();
  },
};
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";
import axios from "axios";

// Candidate backend endpoints to try (edit the first entry to your machine IP:port if needed)
const CANDIDATE_URLS = [
  "http://192.168.1.143:8000/api/notes/", // <-- your machine IP:PORT (preferred)
  "http://127.0.0.1:8000/api/notes/",
  "http://10.0.2.2:8000/api/notes/", // Android emulator (default)
  "http://10.0.3.2:8000/api/notes/", // Genymotion
];
const REQUEST_TIMEOUT = 5000;
axios.defaults.headers.common["Accept"] = "application/json";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [baseUrl, setBaseUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // nicer add UX
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState(null); // {type: 'success'|'error', text}
  const NOTICE_TIMEOUT = 2000;

  // new state for editing + pull-to-refresh
  const [editingNote, setEditingNote] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notes from Django backend
  const fetchNotes = async (url = baseUrl) => {
    if (!url) {
      setError("No backend URL resolved yet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(url, { timeout: REQUEST_TIMEOUT });
      // ensure response.data is an array (avoid crashes if backend returns object)
      const data = Array.isArray(response.data) ? response.data : [];
      setNotes(data);
    } catch (err) {
      console.error("Fetch notes error:", err.response?.status, err.message || err);
      setError(
        `Fetch failed: ${err.response?.status ? `status ${err.response.status}` : (err.message || "unknown error")}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Try candidate URLs and pick the first that responds
  const resolveBaseUrl = async () => {
    for (const candidate of CANDIDATE_URLS) {
      try {
        // quick HEAD/GET to check availability
        await axios.get(candidate, { timeout: 2000 });
        setBaseUrl(candidate);
        console.log("Using backend:", candidate);
        return candidate;
      } catch (e) {
        // log unreachable candidate for debugging and try next
        console.log("Candidate unreachable:", candidate, e.message || e);
      }
    }
    setError("Could not reach any candidate backend URL. Check device-network, emulator host or backend CORS.");
    return null;
  };

  // Add new note
  const addNote = async () => {
    if (title.trim() && content.trim()) {
      setAdding(true);
      setError(null);
      try {
        const url = baseUrl || (await resolveBaseUrl());
        if (!url) throw new Error("No backend URL available");
        await axios.post(url, { title, content }, { timeout: REQUEST_TIMEOUT });
        setTitle("");
        setContent("");
        fetchNotes(url); // refresh notes
        setNotice({ type: "success", text: "Note added" });
        setTimeout(() => setNotice(null), NOTICE_TIMEOUT);
      } catch (err) {
        console.error("Add note error:", err.response?.status, err.message || err);
        const msg = err.response?.status ? `status ${err.response.status}` : (err.message || "unknown error");
        setNotice({ type: "error", text: `Add failed: ${msg}` });
        setTimeout(() => setNotice(null), NOTICE_TIMEOUT);
      } finally {
        setAdding(false);
      }
    }
  };

  // Delete note
  const deleteNote = async (id) => {
    try {
      const url = baseUrl || (await resolveBaseUrl());
      if (!url) throw new Error("No backend URL available");
      await axios.delete(`${url}${id}/`, { timeout: REQUEST_TIMEOUT });
      fetchNotes(url);
    } catch (err) {
      console.error("Delete error:", err.response?.status, err.message || err);
      setError("Delete failed. See console for details.");
    }
  };

  // Open edit modal
  const openEdit = (note) => {
    setEditingNote(note);
    setEditTitle(note.title || "");
    setEditContent(note.content || "");
    setIsModalVisible(true);
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingNote) return;
    try {
      const url = baseUrl || (await resolveBaseUrl());
      if (!url) throw new Error("No backend URL available");
      await axios.put(
        `${url}${editingNote.id}/`,
        { title: editTitle, content: editContent },
        { timeout: REQUEST_TIMEOUT }
      );
      setIsModalVisible(false);
      setEditingNote(null);
      fetchNotes(url);
    } catch (err) {
      console.error("Edit error:", err.response?.status, err.message || err);
      setError("Edit failed. See console for details.");
    }
  };

  useEffect(() => {
    (async () => {
      const resolved = await resolveBaseUrl();
      if (resolved) fetchNotes(resolved);
    })();
  }, []);

  // pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    const url = baseUrl || (await resolveBaseUrl());
    if (url) await fetchNotes(url);
    else setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📒 My Notes</Text>

      <View style={styles.inputRow}>
        <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} maxLength={120} />
        <Text style={{ alignSelf: "flex-end", marginBottom: 6, color: "#6b7280" }}>{title.length}/120</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Content"
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={1000}
        />
        <Text style={{ alignSelf: "flex-end", marginBottom: 6, color: "#6b7280" }}>{content.length}/1000</Text>

        {/* transient notice */}
        {notice ? (
          <View style={{ padding: 8, borderRadius: 6, backgroundColor: notice.type === "success" ? "#d1fae5" : "#fee2e2", marginBottom: 8 }}>
            <Text style={{ color: notice.type === "success" ? "#065f46" : "#b91c1c" }}>{notice.text}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, { opacity: adding || !title.trim() || !content.trim() ? 0.6 : 1 }]}
          onPress={addNote}
          disabled={adding || !title.trim() || !content.trim()}
        >
          {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Note</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostButton} onPress={onRefresh}>
          <Text style={styles.ghostText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}

      <FlatList
        data={notes}
        keyExtractor={(item, index) => (item && item.id != null ? String(item.id) : String(index))}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ paddingBottom: 60 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <Text style={styles.cardContent}>{item.content}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNote(item.id)}>
                <Text style={styles.actionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Edit Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Note</Text>
            <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} placeholder="Title" />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="Content"
              multiline
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity style={[styles.ghostButton, { marginRight: 8 }]} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.ghostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={saveEdit}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// styles (improved aesthetics)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f7",
    padding: 16,
    paddingTop: 44,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: "#0f172a",
  },
  inputRow: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e6e9ee",
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  ghostButton: {
    backgroundColor: "transparent",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  ghostText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardContent: {
    color: "#334155",
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#f59e0b",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  deleteBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
});

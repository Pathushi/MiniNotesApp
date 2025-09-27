import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import axios from "axios";

type Note = {
  id: number;
  title: string;
  content: string;
};

const BASE_URL = "http://192.168.1.143:8000/api/notes/";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // edit modal states
  const [editing, setEditing] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // nicer add UX
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const NOTICE_TIMEOUT = 2000;

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(BASE_URL);
      const data = Array.isArray(response.data) ? response.data : [];
      setNotes(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch notes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const addNote = async () => {
    if (!title.trim() || !content.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await axios.post(BASE_URL, { title, content });
      setTitle("");
      setContent("");
      fetchNotes();
      setNotice({ type: "success", text: "Note added" });
      setTimeout(() => setNotice(null), NOTICE_TIMEOUT);
    } catch (err) {
      console.error(err);
      setError("Add failed");
      setNotice({ type: "error", text: "Add failed" });
      setTimeout(() => setNotice(null), NOTICE_TIMEOUT);
    } finally {
      setAdding(false);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await axios.delete(`${BASE_URL}${id}/`);
      fetchNotes();
    } catch (err) {
      console.error(err);
      setError("Delete failed");
    }
  };

  const startEdit = (note: Note) => {
    setEditing(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await axios.put(`${BASE_URL}${editing.id}/`, { title: editTitle, content: editContent });
      setEditing(null);
      fetchNotes();
    } catch (err) {
      console.error(err);
      setError("Edit failed");
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📒 My Notes</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={[styles.inputCard]}>
        <Text style={[styles.sectionTitle]}>Create Note</Text>
        <TextInput style={[styles.input]} placeholder="Title" value={title} onChangeText={setTitle} maxLength={120} />
        <Text style={{ alignSelf: "flex-end", marginBottom: 6, color: "#6b7280" }}>{title.length}/120</Text>
        <TextInput style={[styles.input, styles.multiline]} placeholder="Content" value={content} onChangeText={setContent} multiline maxLength={1000} />
        <Text style={{ alignSelf: "flex-end", marginBottom: 6, color: "#6b7280" }}>{content.length}/1000</Text>

        {notice ? (
          <View style={{ padding: 8, borderRadius: 6, backgroundColor: notice.type === "success" ? "#d1fae5" : "#fee2e2", marginBottom: 8 }}>
            <Text style={{ color: notice.type === "success" ? "#065f46" : "#b91c1c" }}>{notice.text}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.primaryButton, { opacity: adding || !title.trim() || !content.trim() ? 0.6 : 1 }]} onPress={addNote} disabled={adding || !title.trim() || !content.trim()}>
          {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Note</Text>}
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}

      <FlatList
        data={notes}
        keyExtractor={(item, idx) => (item && item.id ? String(item.id) : String(idx))}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardContent}>{item.content}</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(item)}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNote(item.id)}>
                <Text style={styles.actionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={!!editing} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Note</Text>
            <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} />
            <TextInput style={[styles.input, styles.multiline]} value={editContent} onChangeText={setEditContent} multiline />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity style={[styles.ghostButton, { marginRight: 8 }]} onPress={() => setEditing(null)}>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 44, backgroundColor: "#f1f5f9" },
  header: { fontSize: 26, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  error: { color: "#ef4444", textAlign: "center", marginBottom: 8 },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: "#e6e9ee" },
  multiline: { height: 80, textAlignVertical: "top" },
  primaryButton: { backgroundColor: "#2563eb", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginBottom: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: "#e6eef8" },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  cardContent: { color: "#334155", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  editBtn: { backgroundColor: "#f59e0b", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 8 },
  deleteBtn: { backgroundColor: "#ef4444", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  actionText: { color: "#fff", fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "center", padding: 20 },
  modal: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  ghostButton: { backgroundColor: "transparent", paddingVertical: 10 },
  ghostText: { color: "#2563eb", fontWeight: "600" },
  inputCard: { backgroundColor: "#fff", borderRadius: 10, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e6e9ee" },
  sectionTitle: { fontSize: 16, fontWeight: "500", marginBottom: 12 },
});

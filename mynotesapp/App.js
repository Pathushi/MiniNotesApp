import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  FlatList,
  ActivityIndicator,
  Platform,
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
      setError(`Fetch failed: ${err.response?.status ? `status ${err.response.status}` : (err.message || "unknown error")}`);
    } finally {
      setLoading(false);
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
    setError(
      "Could not reach any candidate backend URL. Check device-network, emulator host or backend CORS."
    );
    return null;
  };

  // Add new note
  const addNote = async () => {
    if (title.trim() && content.trim()) {
      try {
        const url = baseUrl || (await resolveBaseUrl());
        if (!url) throw new Error("No backend URL available");
        await axios.post(url, { title, content }, { timeout: REQUEST_TIMEOUT });
        setTitle("");
        setContent("");
        fetchNotes(url); // refresh notes
      } catch (err) {
        console.error("Add note error:", err.response?.status, err.message || err);
        setError(`Add note failed: ${err.response?.status ? `status ${err.response.status}` : (err.message || "unknown error")}`);
      }
    }
  };

  useEffect(() => {
    (async () => {
      const resolved = await resolveBaseUrl();
      if (resolved) fetchNotes(resolved);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📒 My Notes</Text>
      {baseUrl ? (
        <Text style={{ textAlign: "center", marginBottom: 8 }}>
          Backend: {baseUrl}
        </Text>
      ) : null}
      {error ? (
        <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Content"
        value={content}
        onChangeText={setContent}
        multiline
      />

      <Button title="Add Note" onPress={addNote} />
      <View style={{ height: 12 }} />
      <Button
        title="Refresh"
        onPress={() => fetchNotes(baseUrl)}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}

      <FlatList
        data={notes}
        keyExtractor={(item, index) => (item && item.id != null ? String(item.id) : String(index))}
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>{item.title}</Text>
            <Text>{item.content}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 20,
    marginTop: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: "white",
  },
  noteCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View, Button, FlatList } from "react-native";
import axios from "axios";

type Note = {
  id: number;
  title: string;
  content: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const BASE_URL = "http://192.168.1.143:8000/api/notes/";

  const fetchNotes = async () => {
    try {
      const response = await axios.get(BASE_URL);
      setNotes(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const addNote = async () => {
    if (title && content) {
      await axios.post(BASE_URL, { title, content });
      setTitle("");
      setContent("");
      fetchNotes();
    }
  };

  useEffect(() => { fetchNotes(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📒 My Notes</Text>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={[styles.input, {height: 80}]} placeholder="Content" value={content} onChangeText={setContent} multiline />
      <Button title="Add Note" onPress={addNote} />
      <FlatList data={notes} keyExtractor={item => item.id.toString()} renderItem={({item}) => (
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>{item.title}</Text>
          <Text>{item.content}</Text>
        </View>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, marginTop:40, backgroundColor:"#f8f8f8" },
  heading: { fontSize:24, fontWeight:"bold", marginBottom:20, textAlign:"center" },
  input: { borderWidth:1, borderColor:"#ccc", padding:10, marginBottom:10, borderRadius:5, backgroundColor:"white" },
  noteCard: { backgroundColor:"#fff", padding:15, borderRadius:8, marginVertical:8, shadowColor:"#000", shadowOpacity:0.1, shadowRadius:3, elevation:2 },
  noteTitle: { fontSize:18, fontWeight:"bold" },
});

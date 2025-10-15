import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Platform, Modal, ScrollView, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const WHITE = '#fff';
const LIGHT_GREEN = '#74bfa3';

interface Participant {
  name: string;
}

interface Session {
  id: string;
  date: string;
  topic: string;
  participants: Participant[];
}

export default function TrainingAttendanceScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState<null | string>(null);
  const [newSession, setNewSession] = useState({ date: '', topic: '' });
  const [participantName, setParticipantName] = useState('');
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [editParticipantIdx, setEditParticipantIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Add a new session
  const addSession = () => {
    if (!newSession.date || !newSession.topic) return;
    setSessions([
      ...sessions,
      { id: Date.now().toString(), date: newSession.date, topic: newSession.topic, participants: [] },
    ]);
    setNewSession({ date: '', topic: '' });
    setShowSessionModal(false);
  };

  // Edit a session
  const startEditSession = (session: Session) => {
    setEditSessionId(session.id);
    setNewSession({ date: session.date, topic: session.topic });
    setShowSessionModal(true);
  };
  const saveEditSession = () => {
    setSessions(sessions.map(s =>
      s.id === editSessionId ? { ...s, date: newSession.date, topic: newSession.topic } : s
    ));
    setEditSessionId(null);
    setNewSession({ date: '', topic: '' });
    setShowSessionModal(false);
  };

  // Delete a session
  const deleteSession = (id: string) => {
    Alert.alert('Delete Session', 'Are you sure you want to delete this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setSessions(sessions.filter(s => s.id !== id)) },
    ]);
  };

  // Add participant to a session
  const addParticipant = (sessionId: string) => {
    if (!participantName) return;
    setSessions(sessions.map(s =>
      s.id === sessionId
        ? { ...s, participants: [...s.participants, { name: participantName }] }
        : s
    ));
    setParticipantName('');
  };

  // Edit participant
  const startEditParticipant = (idx: number, name: string) => {
    setEditParticipantIdx(idx);
    setEditValue(name);
  };
  const saveEditParticipant = () => {
    if (showParticipantsModal == null || editParticipantIdx == null) return;
    setSessions(sessions.map(s =>
      s.id === showParticipantsModal
        ? { ...s, participants: s.participants.map((p, i) => i === editParticipantIdx ? { name: editValue } : p) }
        : s
    ));
    setEditParticipantIdx(null);
    setEditValue('');
  };

  // Delete participant
  const deleteParticipant = (sessionId: string, idx: number) => {
    Alert.alert('Delete Participant', 'Are you sure you want to delete this participant?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setSessions(sessions.map(s =>
          s.id === sessionId
            ? { ...s, participants: s.participants.filter((_, i) => i !== idx) }
            : s
        ));
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Training Attendance</Text>
          <Text style={styles.headerSubtitle}>Track training sessions and attendance.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>
      {/* Add Session Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => { setShowSessionModal(true); setEditSessionId(null); setNewSession({ date: '', topic: '' }); }}>
        <MaterialCommunityIcons name="plus" size={22} color={WHITE} />
        <Text style={styles.addButtonText}>Add Session</Text>
      </TouchableOpacity>
      {/* Sessions List */}
      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No sessions logged yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.sessionCard}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionDate}>{item.date}</Text>
              <Text style={styles.sessionTopic}>{item.topic}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => startEditSession(item)}
              >
                <MaterialCommunityIcons name="pencil" size={20} color={GREEN} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => deleteSession(item.id)}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#d32f2f" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.participantsButton}
                onPress={() => setShowParticipantsModal(item.id)}
              >
                <MaterialCommunityIcons name="account-multiple" size={20} color={GREEN} />
                <Text style={styles.participantsButtonText}>Participants ({item.participants.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      {/* Add/Edit Session Modal */}
      <Modal visible={showSessionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editSessionId ? 'Edit Session' : 'Add Training Session'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={newSession.date}
              onChangeText={date => setNewSession({ ...newSession, date })}
            />
            <TextInput
              style={styles.input}
              placeholder="Topic"
              value={newSession.topic}
              onChangeText={topic => setNewSession({ ...newSession, topic })}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowSessionModal(false); setEditSessionId(null); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={editSessionId ? saveEditSession : addSession}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Participants Modal */}
      <Modal visible={!!showParticipantsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Participants</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {sessions.find(s => s.id === showParticipantsModal)?.participants.map((p, idx) => (
                <View key={idx} style={styles.participantRow}>
                  {editParticipantIdx === idx ? (
                    <>
                      <TextInput
                        style={styles.input}
                        value={editValue}
                        onChangeText={setEditValue}
                        autoFocus
                      />
                      <TouchableOpacity style={styles.iconButton} onPress={saveEditParticipant}>
                        <MaterialCommunityIcons name="check" size={20} color={GREEN} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconButton} onPress={() => { setEditParticipantIdx(null); setEditValue(''); }}>
                        <MaterialCommunityIcons name="close" size={20} color="#d32f2f" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.participantName}>{p.name}</Text>
                      <TouchableOpacity style={styles.iconButton} onPress={() => startEditParticipant(idx, p.name)}>
                        <MaterialCommunityIcons name="pencil" size={18} color={GREEN} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconButton} onPress={() => { if (showParticipantsModal) deleteParticipant(showParticipantsModal, idx); }}>
                        <MaterialCommunityIcons name="delete" size={18} color="#d32f2f" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}
            </ScrollView>
            <View style={styles.addParticipantRow}>
              <TextInput
                style={styles.input}
                placeholder="Participant Name"
                value={participantName}
                onChangeText={setParticipantName}
              />
              <TouchableOpacity
                style={styles.addParticipantButton}
                onPress={() => {
                  if (showParticipantsModal) addParticipant(showParticipantsModal);
                }}
              >
                <MaterialCommunityIcons name="plus" size={22} color={WHITE} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => { setShowParticipantsModal(null); setEditParticipantIdx(null); setEditValue(''); }}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: WHITE 
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    justifyContent: 'space-between',
  },
  logo: {
    width: 54,
    height: 54,
    marginRight: 8,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2f1',
    marginTop: 2,
    textAlign: 'center',
  },
  profileImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eee',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: GREEN, 
    borderRadius: 22, 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    alignSelf: 'center', 
    marginVertical: 18 
  },
  addButtonText: { 
    color: WHITE, 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginLeft: 8 
  },
  emptyText: { 
    color: '#888', 
    textAlign: 'center', 
    marginTop: 40 
  },
  sessionCard: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2 
  },
  sessionInfo: {},
  sessionDate: { 
    color: GREEN, 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  sessionTopic: { 
    color: '#333', 
    fontSize: 15, 
    marginTop: 2 
  },
  participantsButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#e0f2ef', 
    borderRadius: 16, 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    marginLeft: 10 
  },
  participantsButtonText: { 
    color: GREEN, 
    fontWeight: 'bold', 
    marginLeft: 6 
  },
  iconButton: { 
    padding: 6, 
    marginHorizontal: 2 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    backgroundColor: WHITE, 
    borderRadius: 18, 
    padding: 22, 
    width: '85%', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 8 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: GREEN, 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  input: { 
    backgroundColor: '#f0f0f0', 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 15, 
    marginBottom: 12, 
    color: GREEN 
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 8 
  },
  cancelButton: { 
    marginRight: 16 
  },
  cancelButtonText: { 
    color: GREEN, 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  saveButton: { 
    backgroundColor: GREEN, 
    borderRadius: 12, 
    paddingVertical: 8, 
    paddingHorizontal: 18 
  },
  saveButtonText: { 
    color: WHITE, 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  addParticipantRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10 
  },
  addParticipantButton: { 
    backgroundColor: GREEN, 
    borderRadius: 12, 
    padding: 10, 
    marginLeft: 8 
  },
  participantRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  participantName: { 
    color: '#333', 
    fontSize: 15, 
    marginLeft: 2, 
    marginRight: 8, 
    flex: 1 
  },
  closeButton: { 
    marginTop: 18, 
    alignSelf: 'center' 
  },
  closeButtonText: { 
    color: GREEN, 
    fontWeight: 'bold', 
    fontSize: 16 
  },
}); 
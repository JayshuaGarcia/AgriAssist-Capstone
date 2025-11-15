import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const FAQS = [
  { q: 'How do I reset my password?', a: 'Go to Privacy & Security and use the Change Password form.' },
  { q: 'How do I contact support?', a: 'Tap the Send Feedback button below to send a message to the admin.' },
  { q: 'How do I update my profile?', a: 'Go to Edit Profile and make your changes.' },
];

export default function ProfileHelpScreen() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Send feedback to admin messages
  const sendFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert('Error', 'Please enter your feedback message.');
      return;
    }

    setSendingFeedback(true);
    try {
      const feedbackData = {
        senderId: 'feedback',
        senderName: 'feedback',
        receiverId: 'admin',
        receiverEmail: 'admin@agriassist.com',
        content: feedbackMessage.trim(),
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'feedback'
      };

      await addDoc(collection(db, 'messages'), feedbackData);
      console.log('✅ Feedback sent successfully');
      
      Alert.alert('Success', 'Thank you for your feedback! It has been sent to the admin messages.');
      setFeedbackMessage('');
      setShowFeedbackModal(false);
    } catch (error) {
      console.error('Error sending feedback:', error);
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    } finally {
      setSendingFeedback(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.sectionTitle}>FAQs</Text>
      {FAQS.map((item, idx) => (
        <View key={idx} style={styles.faqItem}>
          <Text style={styles.faqQ}>{item.q}</Text>
          <Text style={styles.faqA}>{item.a}</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.feedbackBtn} onPress={() => setShowFeedbackModal(true)}>
        <Text style={styles.feedbackText}>Send Feedback</Text>
      </TouchableOpacity>
      <Text style={styles.version}>App Version 1.0.0</Text>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Feedback</Text>
            
            <Text style={styles.label}>Feedback</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              placeholder="Enter your feedback..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowFeedbackModal(false);
                  setFeedbackMessage('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton, sendingFeedback && styles.disabledButton]}
                onPress={sendFeedback}
                disabled={sendingFeedback}
              >
                <Text style={styles.sendButtonText}>
                  {sendingFeedback ? 'Sending...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: GREEN, marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: GREEN, marginTop: 18, marginBottom: 8 },
  faqItem: { marginBottom: 14 },
  faqQ: { fontWeight: 'bold', color: GREEN, fontSize: 15 },
  faqA: { color: '#333', fontSize: 15, marginTop: 2 },
  supportBtn: { backgroundColor: GREEN, borderRadius: 18, paddingVertical: 12, alignItems: 'center', marginTop: 18 },
  supportText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  feedbackBtn: { backgroundColor: LIGHT_GREEN, borderRadius: 18, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  feedbackText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  version: { color: '#888', fontSize: 14, marginTop: 28, textAlign: 'center', marginBottom: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: GREEN,
  },
  disabledButton: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../lib/firebase';

const GREEN = '#16543a';

// Hide the header for this page
export const options = {
  headerShown: false,
};

export default function AdminChatPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { contactId, contactName, contactEmail } = params;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load messages for this contact
  const loadMessages = async () => {
    setLoading(true);
    try {
      // Query messages between admin and this contact
      const sentMessagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', 'admin'),
        where('receiverId', '==', contactId)
      );
      
      const receivedMessagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', contactId),
        where('receiverId', '==', 'admin')
      );
      
      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentMessagesQuery),
        getDocs(receivedMessagesQuery)
      ]);
      
      const sentMessages = sentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'sent'
      }));
      
      const receivedMessages = receivedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'received'
      }));
      
      // Combine and sort all messages by timestamp
      const allMessages = [...sentMessages, ...receivedMessages]
        .sort((a, b) => a.timestamp - b.timestamp);
      
      setMessages(allMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const messageData = {
        id: Date.now().toString(),
        senderId: 'admin',
        senderName: 'Admin',
        receiverId: contactId,
        receiverEmail: contactEmail,
        content: newMessage.trim(),
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'admin_message'
      };

      await addDoc(collection(db, 'messages'), messageData);
      
      // Add to local state immediately
      setMessages(prev => [...prev, { ...messageData, type: 'sent' }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (contactId) {
      loadMessages();
    }
  }, [contactId]);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      {/* Top Green Border */}
      <View style={styles.topBorder} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        
        <View style={styles.contactInfo}>
          <View style={styles.contactAvatar}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{contactName}</Text>
            <Text style={styles.contactEmail}>{contactEmail}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.optionsButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <View key={message.id} style={[
              styles.messageContainer,
              message.type === 'sent' ? styles.sentMessageContainer : styles.receivedMessageContainer
            ]}>
              <View style={[
                styles.messageBubble,
                message.type === 'sent' ? styles.sentBubble : styles.receivedBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  message.type === 'sent' ? styles.sentMessageText : styles.receivedMessageText
                ]}>
                  {message.content}
                </Text>
                <Text style={[
                  styles.messageTime,
                  message.type === 'sent' ? styles.sentMessageTime : styles.receivedMessageTime
                ]}>
                  {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Unknown'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation by sending a message</Text>
          </View>
        )}
      </ScrollView>

       {/* Message Input */}
       <View style={styles.inputContainer}>
         <View style={styles.inputWrapper}>
           <TextInput
             style={styles.textInput}
             placeholder="Type a message..."
             value={newMessage}
             onChangeText={setNewMessage}
             multiline
             maxLength={500}
           />
           <TouchableOpacity
             style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
             onPress={sendMessage}
             disabled={!newMessage.trim() || sending}
           >
             <Ionicons 
               name="send" 
               size={20} 
               color={newMessage.trim() && !sending ? "#fff" : "#ccc"} 
             />
           </TouchableOpacity>
         </View>
       </View>
       
       {/* Bottom Green Border */}
       <View style={styles.bottomBorder} />
     </View>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBorder: {
    height: 36,
    width: '100%',
    backgroundColor: GREEN,
    shadowColor: 'transparent',
    elevation: 0,
  },
  bottomBorder: {
    height: 36,
    width: '100%',
    backgroundColor: GREEN,
    shadowColor: 'transparent',
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    color: '#666',
  },
  optionsButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentBubble: {
    backgroundColor: GREEN,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  sentMessageTime: {
    color: '#fff',
    textAlign: 'right',
  },
  receivedMessageTime: {
    color: '#666',
    textAlign: 'left',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 30, // Account for home indicator
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});

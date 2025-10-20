import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { useNavigationBar } from '../hooks/useNavigationBar';
import { db } from '../lib/firebase';

const GREEN = '#16543a';

// Hide the header for this page
export const options = {
  headerShown: false,
};

export default function UserChatPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { contactId, contactName, contactEmail } = params;
  const { profile, user } = useAuth();
  
  // Configure navigation bar to be hidden (same as admin)
  useNavigationBar('hidden');

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userDocId, setUserDocId] = useState<string>('');
  const [adminProfile, setAdminProfile] = useState<any>(null);

  // Get user's document ID
  const getUserDocId = async () => {
    if (!user?.email) return '';
    
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', user.email)
      );
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        console.log('No user document found for current user');
        return '';
      }
      
      return userSnapshot.docs[0].id;
    } catch (error) {
      console.error('Error getting user document ID:', error);
      return '';
    }
  };

  // Load admin profile data
  const loadAdminProfile = async () => {
    try {
      // The admin user ID is 'UIcMju8YbdX3VfYAjEbCem39bNe2' (from the unified admin system)
      const adminDoc = await getDoc(doc(db, 'users', 'UIcMju8YbdX3VfYAjEbCem39bNe2'));
      if (adminDoc.exists()) {
        setAdminProfile(adminDoc.data());
      }
    } catch (error) {
      console.error('Error loading admin profile:', error);
    }
  };

  // Mark received messages as read
  const markMessagesAsRead = async () => {
    if (!userDocId) return;
    
    try {
      const q = query(
        collection(db, 'messages'),
        where('senderId', '==', 'admin'),
        where('receiverId', '==', userDocId),
        where('isRead', '==', false)
      );
      
      const unreadSnapshot = await getDocs(q);
      
      const updatePromises = unreadSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true, readAt: new Date().toISOString() })
      );
      
      await Promise.all(updatePromises);
      console.log(`Marked ${unreadSnapshot.docs.length} messages as read`);
      
      // Force a small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Load messages for this contact
  const loadMessages = async () => {
    if (!userDocId) return;
    
    setLoading(true);
    try {
      // Query messages between user and this contact (admin)
      const sentMessagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', userDocId), // User's ID
        where('receiverId', '==', 'admin')
      );
      
      const receivedMessagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', 'admin'),
        where('receiverId', '==', userDocId) // User's ID
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
      
      // Mark received messages as read
      await markMessagesAsRead();
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !userDocId) return;

    setSending(true);
    try {
      const messageData = {
        senderId: userDocId, // User's ID
        senderName: user?.displayName || 'User',
        receiverId: 'admin',
        receiverEmail: 'admin@agriassist.com',
        content: newMessage.trim(),
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'user_message'
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      console.log('✅ Message sent with ID:', docRef.id);
      
      // Add to local state immediately with the correct Firebase-generated ID
      setMessages(prev => [...prev, { ...messageData, id: docRef.id, type: 'sent' }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: string, messageContent: string) => {
    Alert.alert(
      'Delete Message',
      `Are you sure you want to delete this message?\n\n"${messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Attempting to delete message:', messageId);
              
              // Find the message document reference
              const messageRef = doc(db, 'messages', messageId);
              console.log('📄 Message reference created:', messageRef.path);
              
              // Try to read the document first to confirm it exists
              const beforeDelete = await getDoc(messageRef);
              console.log('📖 Document exists before deletion:', beforeDelete.exists());
              
              if (beforeDelete.exists()) {
                console.log('📖 Document data before deletion:', beforeDelete.data());
                
                // Delete the document
                await deleteDoc(messageRef);
                console.log('✅ Message deleted from database successfully');
                
                // Remove from local state
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
                console.log('🔄 Local state updated - message removed from UI');
                
                Alert.alert('Success', 'Message deleted successfully');
              } else {
                console.log('⚠️ Document does not exist - searching for correct ID...');
                
                // Find the correct Firebase document ID by searching for the message content
                const messageToDelete = messages.find(msg => msg.id === messageId);
                if (messageToDelete) {
                  console.log('🔍 Looking for message with content:', messageToDelete.content);
                  
                  // Search for the message by content and sender
                  const searchQuery = query(
                    collection(db, 'messages'),
                    where('content', '==', messageToDelete.content),
                    where('senderId', '==', messageToDelete.senderId || userDocId)
                  );
                  
                  const searchSnapshot = await getDocs(searchQuery);
                  if (searchSnapshot.docs.length > 0) {
                    const correctDoc = searchSnapshot.docs[0];
                    console.log('✅ Found correct document with ID:', correctDoc.id);
                    
                    // Update the message reference to use the correct ID
                    const correctMessageRef = doc(db, 'messages', correctDoc.id);
                    console.log('🔄 Using correct message reference:', correctMessageRef.path);
                    
                    // Delete the correct document
                    await deleteDoc(correctMessageRef);
                    console.log('✅ Message deleted from database successfully (using correct ID)');
                    
                    // Remove from local state
                    setMessages(prev => prev.filter(msg => msg.id !== messageId));
                    console.log('🔄 Local state updated - message removed from UI');
                    
                    Alert.alert('Success', 'Message deleted successfully');
                  } else {
                    console.log('❌ Could not find message in database');
                    Alert.alert('Error', 'Message not found in database');
                  }
                } else {
                  console.log('❌ Could not find message in local state');
                  Alert.alert('Error', 'Message not found');
                }
              }
            } catch (error) {
              console.error('❌ Error deleting message:', error);
              console.error('Error details:', {
                messageId,
                errorMessage: error.message,
                errorCode: error.code
              });
              Alert.alert('Error', `Failed to delete message: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const initializeUser = async () => {
      const docId = await getUserDocId();
      setUserDocId(docId);
      await loadAdminProfile();
    };
    
    initializeUser();
  }, [user]);

  useEffect(() => {
    if (userDocId) {
      loadMessages();
    }
  }, [userDocId]);

  // Mark messages as read when chat is focused
  useFocusEffect(
    useCallback(() => {
      if (userDocId) {
        console.log('User chat focused - marking messages as read');
        markMessagesAsRead();
      }
    }, [userDocId])
  );

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
            <Text style={styles.contactName}>{contactName || 'Admin'}</Text>
            <Text style={styles.contactEmail}>{contactEmail || 'admin@agriassist.com'}</Text>
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
            <TouchableOpacity 
              key={message.id} 
              style={[
                styles.messageContainer,
                message.type === 'sent' ? styles.sentMessageContainer : styles.receivedMessageContainer
              ]}
              onLongPress={() => {
                // Only allow deletion of sent messages (user's own messages)
                if (message.type === 'sent') {
                  deleteMessage(message.id, message.content);
                }
              }}
              delayLongPress={500}
              activeOpacity={message.type === 'sent' ? 0.7 : 1}
            >
              {message.type === 'sent' && (
                <View style={styles.sentMessageAvatar}>
                  <Text style={styles.sentMessageCropIcon}>
                    {profile.selectedCropEmoji || '🌱'}
                  </Text>
                </View>
              )}
              {message.type === 'received' && (
                <View style={styles.receivedMessageAvatar}>
                  <Text style={styles.receivedMessageCropIcon}>
                    {adminProfile?.selectedCropEmoji || '👨‍💼'}
                  </Text>
                </View>
              )}
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
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sentMessageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentMessageCropIcon: {
    fontSize: 18,
  },
  receivedMessageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#16543a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receivedMessageCropIcon: {
    fontSize: 18,
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

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigationBar } from '../hooks/useNavigationBar';
import { db } from '../lib/firebase';

const GREEN = '#16543a';

// Hide the header for this page
export const options = {
  headerShown: false,
};

export default function AdminChatPage() {
  const router = useRouter();
  const { contactId, contactName, contactEmail } = useLocalSearchParams<{
    contactId: string;
    contactName: string;
    contactEmail: string;
  }>();
  
  // Configure navigation bar to be hidden (same as user screens)
  useNavigationBar('hidden');

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);

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

  // Load user profile data
  const loadUserProfile = async () => {
    if (!contactId) return;
    
    try {
      console.log('👤 Loading user profile for:', contactId);
      const userDoc = await getDoc(doc(db, 'users', contactId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ User profile loaded:', {
          id: contactId,
          name: userData.name,
          email: userData.email,
          isBlocked: userData.isBlocked,
          blockedAt: userData.blockedAt,
          blockedBy: userData.blockedBy
        });
        setUserProfile(userData);
        setIsUserBlocked(userData.isBlocked || false);
      } else {
        console.warn('⚠️ User document not found:', contactId);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      console.error('Error details:', {
        contactId,
        errorMessage: error.message,
        errorCode: error.code
      });
    }
  };

  // Mark received messages as read
  const markMessagesAsRead = async () => {
    if (!contactId) return;
    
    try {
      // Find all unread messages from this contact to admin
      const unreadMessagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', contactId),
        where('receiverId', '==', 'admin'),
        where('isRead', '==', false)
      );
      
      const unreadSnapshot = await getDocs(unreadMessagesQuery);
      
      // Update each unread message
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
    setLoading(true);
    try {
      console.log('💬 Loading messages for conversation with:', contactId);
      
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
      
      console.log('🔍 Querying for sent messages...');
      const sentSnapshot = await getDocs(sentMessagesQuery);
      console.log(`📤 Found ${sentSnapshot.docs.length} sent messages`);
      
      console.log('🔍 Querying for received messages...');
      const receivedSnapshot = await getDocs(receivedMessagesQuery);
      console.log(`📥 Found ${receivedSnapshot.docs.length} received messages`);
      
      const sentMessages = sentSnapshot.docs.map(doc => {
        const messageData = {
          id: doc.id,
          ...doc.data(),
          type: 'sent'
        };
        console.log('📤 Sent message:', { 
          id: doc.id, 
          content: messageData.content,
          timestamp: messageData.timestamp,
          createdAt: messageData.createdAt,
          originalId: messageData.id
        });
        return messageData;
      });
      
      const receivedMessages = receivedSnapshot.docs.map(doc => {
        const messageData = {
          id: doc.id,
          ...doc.data(),
          type: 'received'
        };
        console.log('📥 Received message:', { 
          id: doc.id, 
          content: messageData.content,
          timestamp: messageData.timestamp,
          createdAt: messageData.createdAt,
          originalId: messageData.id
        });
        return messageData;
      });
      
      // Combine and sort all messages by timestamp
      const allMessages = [...sentMessages, ...receivedMessages]
        .sort((a, b) => a.timestamp - b.timestamp);
      
      console.log(`✅ Loaded ${allMessages.length} total messages for conversation`);
      setMessages(allMessages);
      
      // Mark received messages as read
      await markMessagesAsRead();
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      console.error('Error details:', {
        contactId,
        errorMessage: error.message,
        errorCode: error.code
      });
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

  // Test database connection and permissions
  const testDatabaseConnection = async () => {
    try {
      console.log('🧪 Testing database connection...');
      console.log('🔍 Database object details:', {
        type: typeof db,
        constructor: db?.constructor?.name,
        hasCollection: typeof db?.collection === 'function',
        hasDoc: typeof db?.doc === 'function',
        isRealFirestore: db?.constructor?.name === 'Firestore'
      });
      
      // Check if we're using real Firebase or fallback
      if (db?.constructor?.name !== 'Firestore') {
        console.error('❌ CRITICAL: Using fallback database object, not real Firebase!');
        console.error('❌ This means all database operations are fake and not persisting!');
        return false;
      }
      
      // Test if collection and doc functions actually work
      try {
        const testCollection = collection(db, 'test');
        console.log('✅ Collection function works:', typeof testCollection);
        
        const testDocRef = doc(testCollection);
        console.log('✅ Doc function works:', typeof testDocRef);
        
        // Try to write a test document
        await setDoc(testDocRef, { 
          test: true, 
          timestamp: new Date().toISOString(),
          message: 'Database connection test'
        });
        console.log('✅ Database write test successful');
        
        // Try to read the test document
        const readDoc = await getDoc(testDocRef);
        console.log('✅ Database read test successful:', readDoc.exists());
        
        if (readDoc.exists()) {
          console.log('📄 Test document data:', readDoc.data());
        }
        
        // Try to delete the test document
        await deleteDoc(testDocRef);
        console.log('✅ Database delete test successful');
        
        // Verify deletion
        const verifyDoc = await getDoc(testDocRef);
        console.log('✅ Deletion verification:', !verifyDoc.exists());
        
        return true;
        
      } catch (operationError) {
        console.error('❌ Database operation test failed:', operationError);
        console.error('Operation error details:', {
          errorMessage: operationError.message,
          errorCode: operationError.code,
          errorStack: operationError.stack
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ Database test failed:', error);
      console.error('Error details:', {
        errorMessage: error.message,
        errorCode: error.code
      });
      return false;
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
              console.log('🔍 Current database object:', db);
              console.log('🔍 Database constructor:', db?.constructor?.name);
              
              // Test database connection first
              const dbTestResult = await testDatabaseConnection();
              if (!dbTestResult) {
                Alert.alert('Error', 'Database connection failed. Cannot delete message.');
                return;
              }
              
              // Find the message document reference
              const messageRef = doc(db, 'messages', messageId);
              console.log('📄 Message reference created:', messageRef.path);
              console.log('📄 Message reference type:', typeof messageRef);
              
              // Try to read the document first to confirm it exists
              const beforeDelete = await getDoc(messageRef);
              console.log('📖 Document exists before deletion:', beforeDelete.exists());
              console.log('📖 Message reference path:', messageRef.path);
              console.log('📖 Message ID being deleted:', messageId);
              
              if (beforeDelete.exists()) {
                console.log('📖 Document data before deletion:', beforeDelete.data());
              } else {
                console.log('⚠️ Document does not exist - checking if ID is correct...');
                
                // Find the correct Firebase document ID by searching for the message content
                const messageToDelete = messages.find(msg => msg.id === messageId);
                if (messageToDelete) {
                  console.log('🔍 Looking for message with content:', messageToDelete.content);
                  
                  // Search for the message by content and sender
                  const searchQuery = query(
                    collection(db, 'messages'),
                    where('content', '==', messageToDelete.content),
                    where('senderId', '==', messageToDelete.senderId || 'admin')
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
                    return;
                  } else {
                    console.log('❌ Could not find message in database');
                  }
                }
                
                // Let's check what documents actually exist in the messages collection
                const allMessagesQuery = query(collection(db, 'messages'));
                const allMessagesSnapshot = await getDocs(allMessagesQuery);
                console.log('📋 All messages in database:');
                allMessagesSnapshot.docs.forEach(doc => {
                  console.log(`  - ID: ${doc.id}, Content: ${doc.data().content}, Sender: ${doc.data().senderId}`);
                });
              }
              
              // Delete the document
              console.log('🗑️ Executing deleteDoc...');
              await deleteDoc(messageRef);
              console.log('✅ Message deleted from database successfully');
              
              // Verify deletion by trying to read the document
              try {
                const verifyRef = doc(db, 'messages', messageId);
                const verifyDoc = await getDoc(verifyRef);
                if (verifyDoc.exists()) {
                  console.warn('⚠️ Warning: Message still exists after deletion attempt');
                  console.warn('⚠️ Document data after deletion:', verifyDoc.data());
                } else {
                  console.log('✅ Verification: Message successfully deleted from database');
                }
              } catch (verifyError) {
                console.log('✅ Verification: Document no longer exists (deleted successfully)');
              }
              
              // Remove from local state
              setMessages(prev => prev.filter(msg => msg.id !== messageId));
              console.log('🔄 Local state updated - message removed from UI');
              
              Alert.alert('Success', 'Message deleted successfully');
            } catch (error) {
              console.error('❌ Error deleting message:', error);
              console.error('Error details:', {
                messageId,
                errorMessage: error.message,
                errorCode: error.code,
                errorStack: error.stack
              });
              Alert.alert('Error', `Failed to delete message: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  // Block/Unblock user
  const toggleUserBlock = async () => {
    if (!contactId) return;

    const action = isUserBlocked ? 'unblock' : 'block';
    const actionText = isUserBlocked ? 'unblock' : 'block';
    
    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} User`,
      `Are you sure you want to ${actionText} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: isUserBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              console.log(`🔒 Attempting to ${actionText} user:`, contactId);
              
              const userRef = doc(db, 'users', contactId);
              console.log('👤 User reference created:', userRef.path);
              
              const updateData = {
                isBlocked: !isUserBlocked,
                blockedAt: !isUserBlocked ? new Date().toISOString() : null,
                blockedBy: !isUserBlocked ? 'admin' : null
              };
              
              console.log('📝 Update data:', updateData);
              
              await updateDoc(userRef, updateData);
              console.log(`✅ User ${actionText}ed successfully in database`);
              
              // Verify the update by reading the document
              try {
                const verifyDoc = await getDoc(userRef);
                if (verifyDoc.exists()) {
                  const userData = verifyDoc.data();
                  console.log('✅ Verification: User data updated:', {
                    isBlocked: userData.isBlocked,
                    blockedAt: userData.blockedAt,
                    blockedBy: userData.blockedBy
                  });
                } else {
                  console.warn('⚠️ Warning: User document not found after update');
                }
              } catch (verifyError) {
                console.error('❌ Error verifying user update:', verifyError);
              }

              setIsUserBlocked(!isUserBlocked);
              setShowMenu(false);
              
              Alert.alert(
                'Success',
                `User has been ${actionText}ed successfully.`
              );
            } catch (error) {
              console.error(`❌ Error ${actionText}ing user:`, error);
              console.error('Error details:', {
                contactId,
                actionText,
                errorMessage: error.message,
                errorCode: error.code
              });
              Alert.alert('Error', `Failed to ${actionText} user: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  // Delete entire conversation
  const deleteConversation = async () => {
    if (!contactId) return;

    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to permanently delete this entire conversation? This action cannot be undone and will remove all messages between you and this user.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Attempting to delete conversation with user:', contactId);
              
              // Get all messages in this conversation
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
              
              console.log('🔍 Querying for sent messages...');
              const sentSnapshot = await getDocs(sentMessagesQuery);
              console.log(`📤 Found ${sentSnapshot.docs.length} sent messages`);
              
              console.log('🔍 Querying for received messages...');
              const receivedSnapshot = await getDocs(receivedMessagesQuery);
              console.log(`📥 Found ${receivedSnapshot.docs.length} received messages`);
              
              // Delete all sent messages
              console.log('🗑️ Deleting sent messages...');
              const sentDeletePromises = sentSnapshot.docs.map(doc => {
                console.log('Deleting sent message:', doc.id);
                return deleteDoc(doc.ref);
              });
              
              // Delete all received messages
              console.log('🗑️ Deleting received messages...');
              const receivedDeletePromises = receivedSnapshot.docs.map(doc => {
                console.log('Deleting received message:', doc.id);
                return deleteDoc(doc.ref);
              });
              
              console.log('⏳ Executing all delete operations...');
              await Promise.all([...sentDeletePromises, ...receivedDeletePromises]);
              console.log('✅ All messages deleted from database successfully');
              
              // Clear local messages
              setMessages([]);
              setShowMenu(false);
              
              Alert.alert(
                'Success',
                'Conversation has been deleted successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error) {
              console.error('❌ Error deleting conversation:', error);
              console.error('Error details:', {
                contactId,
                errorMessage: error.message,
                errorCode: error.code
              });
              Alert.alert('Error', `Failed to delete conversation: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (contactId && contactId !== 'temp-contact-id') {
      loadMessages();
      loadUserProfile();
      loadAdminProfile();
    }
  }, [contactId]);

  // Mark messages as read when chat is focused
  useFocusEffect(
    useCallback(() => {
      if (contactId && contactId !== 'temp-contact-id') {
        console.log('Chat focused - marking messages as read');
        markMessagesAsRead();
      }
    }, [contactId])
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
            <Text style={styles.contactName}>{contactName ? decodeURIComponent(contactName) : 'User'}</Text>
            <Text style={styles.contactEmail}>{contactEmail ? decodeURIComponent(contactEmail) : 'user@example.com'}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testDatabaseConnection}
        >
          <Ionicons name="bug" size={20} color={GREEN} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={() => setShowMenu(true)}
        >
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
                // Only allow deletion of sent messages (admin's own messages)
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
                    {adminProfile?.selectedCropEmoji || '👨‍💼'}
                  </Text>
                </View>
              )}
              {message.type === 'received' && (
                <View style={styles.receivedMessageAvatar}>
                  <Text style={styles.receivedMessageCropIcon}>
                    {userProfile?.selectedCropEmoji || '🌱'}
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

       {/* Options Menu Modal */}
       <Modal
         visible={showMenu}
         transparent={true}
         animationType="fade"
         onRequestClose={() => setShowMenu(false)}
       >
         <TouchableOpacity 
           style={styles.menuOverlay}
           activeOpacity={1}
           onPress={() => setShowMenu(false)}
         >
           <View style={styles.menuContainer}>
             <TouchableOpacity 
               style={styles.menuItem}
               onPress={() => {
                 setShowMenu(false);
                 toggleUserBlock();
               }}
             >
               <Ionicons 
                 name={isUserBlocked ? "checkmark-circle" : "ban"} 
                 size={20} 
                 color={isUserBlocked ? GREEN : "#e74c3c"} 
               />
               <Text style={[
                 styles.menuItemText,
                 { color: isUserBlocked ? GREEN : "#e74c3c" }
               ]}>
                 {isUserBlocked ? 'Unblock User' : 'Block User'}
               </Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.menuItem}
               onPress={() => {
                 setShowMenu(false);
                 deleteConversation();
               }}
             >
               <Ionicons name="trash" size={20} color="#e74c3c" />
               <Text style={[styles.menuItemText, { color: "#e74c3c" }]}>
                 Delete Conversation
               </Text>
             </TouchableOpacity>
           </View>
         </TouchableOpacity>
       </Modal>
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
  testButton: {
    padding: 8,
    marginRight: 8,
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
  sentMessageAvatar: {
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
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});

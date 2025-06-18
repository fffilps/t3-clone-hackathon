import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { useChat } from '@/providers/ChatProvider';
import { router } from 'expo-router';
import { User, Mail, MessageCircle, Settings, LogOut, Shield, Info, CircleHelp as HelpCircle, Palette, Key, CreditCard as Edit3 } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { contexts, userProfile, updateUserProfile } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedOccupation, setEditedOccupation] = useState('');

  useEffect(() => {
    if (userProfile) {
      setEditedName(userProfile.preferred_name || '');
      setEditedOccupation(userProfile.occupation || '');
    }
  }, [userProfile]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile({
        preferred_name: editedName || null,
        occupation: editedOccupation || null,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const ProfileSection = ({ 
    title, 
    children 
  }: { 
    title: string; 
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const ProfileItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    danger = false,
    rightElement
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.profileItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemIcon}>
        {icon}
      </View>
      <View style={styles.profileItemContent}>
        <Text style={[
          styles.profileItemTitle,
          danger && styles.dangerText
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.profileItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  const displayName = userProfile?.preferred_name || user?.user_metadata?.full_name || 'User';

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#8B5CF6', '#3B82F6']}
                style={styles.avatar}
              >
                <User size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {userProfile?.occupation && (
              <Text style={styles.userOccupation}>{userProfile.occupation}</Text>
            )}
          </View>

          <ProfileSection title="Personal Information">
            {isEditing ? (
              <View style={styles.editContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preferred Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Enter your preferred name"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Occupation</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editedOccupation}
                    onChangeText={setEditedOccupation}
                    placeholder="Enter your occupation"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.editButton, styles.cancelButton]}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, styles.saveButton]}
                    onPress={handleSaveProfile}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <ProfileItem
                icon={<Edit3 size={20} color="#8B5CF6" />}
                title="Edit Profile"
                subtitle="Update your personal information"
                onPress={() => setIsEditing(true)}
              />
            )}
            
            <ProfileItem
              icon={<Mail size={20} color="#8B5CF6" />}
              title="Email"
              subtitle={user?.email}
            />
            <ProfileItem
              icon={<MessageCircle size={20} color="#8B5CF6" />}
              title="Conversations"
              subtitle={`${contexts.length} total conversations`}
            />
          </ProfileSection>

          <ProfileSection title="Preferences">
            <ProfileItem
              icon={<Palette size={20} color="#8B5CF6" />}
              title="Theme"
              subtitle={userProfile?.selected_theme || 'Modern'}
              onPress={() => Alert.alert('Theme', 'Theme customization coming soon!')}
            />
            <ProfileItem
              icon={<Key size={20} color="#8B5CF6" />}
              title="API Keys"
              subtitle="Manage your AI provider keys"
              onPress={() => Alert.alert('API Keys', 'API key management coming soon!')}
            />
          </ProfileSection>

          <ProfileSection title="App">
            <ProfileItem
              icon={<Settings size={20} color="#8B5CF6" />}
              title="Settings"
              subtitle="Customize your experience"
              onPress={() => Alert.alert('Settings', 'Settings coming soon!')}
            />
            <ProfileItem
              icon={<Shield size={20} color="#8B5CF6" />}
              title="Privacy & Security"
              subtitle="Manage your data and privacy"
              onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon!')}
            />
            <ProfileItem
              icon={<HelpCircle size={20} color="#8B5CF6" />}
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => Alert.alert('Support', 'Support coming soon!')}
            />
            <ProfileItem
              icon={<Info size={20} color="#8B5CF6" />}
              title="About"
              subtitle="Version 1.0.0"
              onPress={() => Alert.alert('About', 'AI Chat Mobile v1.0.0\nBuilt with Expo and Supabase')}
            />
          </ProfileSection>

          <ProfileSection title="Account Management">
            <ProfileItem
              icon={<LogOut size={20} color="#EF4444" />}
              title="Sign Out"
              subtitle="Sign out of your account"
              onPress={handleSignOut}
              danger
            />
          </ProfileSection>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  userOccupation: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  dangerText: {
    color: '#EF4444',
  },
  editContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
});
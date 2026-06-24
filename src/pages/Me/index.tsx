import React, { useState, useCallback } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  View,
  Text,
  Dimensions,
  StyleSheet,
} from 'react-native';

import { MaterialIcons, AntDesign, FontAwesome, Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import Constants from 'expo-constants';
import avatar from '../../assets/avatar.png';
import { useAuth } from '../../contexts/AuthContext';
import { getUserVideos, resendVerificationEmail, FeedItem } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';

import EmailVerificationBanner from './EmailVerificationBanner';
import {
  Container,
  Title,
  Header,
  Avatar,
  Username,
  Content,
  Stats,
  Separator,
  StatsText,
  StatsColumn,
  StatsNumber,
  ProfileColumn,
  ProfileEdit,
  ProfileText,
  Bookmark,
} from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = SCREEN_WIDTH / 3 - 1;

const Me: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [videos, setVideos] = useState<FeedItem[]>([]);
  const [resendLoading, setResendLoading] = useState(false);

  const handleResendVerification = async () => {
    if (!accessToken) return;
    setResendLoading(true);
    try {
      await resendVerificationEmail(accessToken);
      Alert.alert('Email enviado', 'Revisá tu bandeja de entrada.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo reenviar.');
    } finally {
      setResendLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!accessToken || !user) return;
      getUserVideos(user.id, accessToken)
        .then(setVideos)
        .catch(() => setVideos([]));
    }, [accessToken, user]),
  );

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  const ProfileHeader = (
    <Content>
      <Avatar source={avatar} />
      <Username>@{user?.username ?? ''}</Username>

      {user && !user.email_verified && (
        <EmailVerificationBanner
          email={user.email}
          loading={resendLoading}
          onResend={handleResendVerification}
        />
      )}

      <Stats>
        <TouchableOpacity
          onPress={() =>
            user && navigation.navigate('FollowList', { userId: user.id, type: 'following', title: 'Siguiendo' })
          }
        >
          <StatsColumn>
            <StatsNumber>{user?.following_count ?? 0}</StatsNumber>
            <StatsText>Siguiendo</StatsText>
          </StatsColumn>
        </TouchableOpacity>
        <Separator>|</Separator>
        <TouchableOpacity
          onPress={() =>
            user && navigation.navigate('FollowList', { userId: user.id, type: 'followers', title: 'Seguidores' })
          }
        >
          <StatsColumn>
            <StatsNumber>{user?.followers_count ?? 0}</StatsNumber>
            <StatsText>Seguidores</StatsText>
          </StatsColumn>
        </TouchableOpacity>
        <Separator>|</Separator>
        <StatsColumn>
          <StatsNumber>{videos.length}</StatsNumber>
          <StatsText>Videos</StatsText>
        </StatsColumn>
      </Stats>
      <ProfileColumn>
        <ProfileEdit onPress={() => navigation.navigate('EditProfile')}>
          <ProfileText>Editar perfil</ProfileText>
        </ProfileEdit>
        <Bookmark name="bookmark" size={24} color="black" />
      </ProfileColumn>
      <StatsText>{user?.bio || 'Tocá para agregar una bio'}</StatsText>

      <View style={meStyles.settingsSection}>
        <Text style={meStyles.sectionTitle}>Ajustes y legal</Text>
        <TouchableOpacity
          style={meStyles.settingsRow}
          onPress={() => navigation.navigate('Legal', { tab: 'terms' })}
        >
          <Ionicons name="document-text-outline" size={20} color="#555" />
          <Text style={meStyles.settingsText}>Términos y Condiciones</Text>
          <Ionicons name="chevron-forward" size={16} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity
          style={meStyles.settingsRow}
          onPress={() => navigation.navigate('Legal', { tab: 'privacy' })}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="#555" />
          <Text style={meStyles.settingsText}>Política de Privacidad</Text>
          <Ionicons name="chevron-forward" size={16} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity
          style={meStyles.settingsRow}
          onPress={() => navigation.navigate('Legal', { tab: 'community' })}
        >
          <Ionicons name="people-outline" size={20} color="#555" />
          <Text style={meStyles.settingsText}>Normas de la Comunidad</Text>
          <Ionicons name="chevron-forward" size={16} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[meStyles.settingsRow, meStyles.deleteRow]}
          onPress={() => navigation.navigate('DeleteAccount')}
        >
          <Ionicons name="trash-outline" size={20} color="#E5363A" />
          <Text style={[meStyles.settingsText, meStyles.deleteText]}>Eliminar cuenta</Text>
          <Ionicons name="chevron-forward" size={16} color="#E5363A" />
        </TouchableOpacity>
      </View>
      <Text style={meStyles.versionText}>
        QueVesVe!& v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Content>
  );

  return (
    <Container>
      <Header>
        <AntDesign
          style={{ position: 'absolute', left: 10, top: 10 }}
          name="adduser"
          size={24}
          color="black"
        />
        <Title>{user?.username ?? ''}</Title>
        <MaterialIcons name="arrow-drop-down" size={24} color="black" />
        <TouchableOpacity
          style={{ position: 'absolute', right: 4, top: 2, padding: 12 }}
          onPress={handleLogout}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Feather name="log-out" size={22} color="#555" />
        </TouchableOpacity>
      </Header>

      <FlatList
        data={videos}
        keyExtractor={item => String(item.id)}
        numColumns={3}
        ListHeaderComponent={ProfileHeader}
        columnWrapperStyle={{ gap: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
        renderItem={({ item }) => (
          <View
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE * 1.4,
              backgroundColor: '#1a1a1a',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {item.thumbnail_url ? (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <FontAwesome name="play" size={24} color="rgba(255,255,255,0.5)" />
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#aaa', fontSize: 14 }}>
              Todavía no subiste ningún video
            </Text>
          </View>
        }
      />
    </Container>
  );
};

const meStyles = StyleSheet.create({
  settingsSection: {
    width: '100%',
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 12,
  },
  settingsText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  deleteRow: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#E5363A',
  },
  versionText: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 8,
  },
});

export default Me;

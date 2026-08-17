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
  ProfileTopRow,
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

// Íconos sin funcionalidad todavía (agregar cuenta, cambiar de cuenta, guardados).
// Se ocultan sin borrarlos para poder reactivarlos cuando tengan una acción real.
const SHOW_PLACEHOLDER_ICONS = false;

const Me: React.FC = () => {
  const { user, accessToken, logout, refreshUser } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [videos, setVideos] = useState<FeedItem[]>([]);
  const [resendLoading, setResendLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleResendVerification = async () => {
    if (!accessToken) return;
    setResendLoading(true);
    try {
      const { detail } = await resendVerificationEmail(accessToken);
      if (detail.includes('ya está verificado')) {
        Alert.alert('Ya estás verificado', detail);
        refreshUser();
      } else {
        Alert.alert('Email enviado', 'Revisá tu bandeja de entrada.');
      }
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo reenviar.');
    } finally {
      setResendLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!accessToken || !user) return;
      refreshUser();
      getUserVideos(user.id, accessToken)
        .then(setVideos)
        .catch(() => setVideos([]));
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <ProfileTopRow>
        <Avatar source={avatar} />
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
      </ProfileTopRow>

      <Username>@{user?.username ?? ''}</Username>
      <Text style={meStyles.bioText}>{user?.bio || 'Tocá para agregar una bio'}</Text>

      {user && !user.email_verified && (
        <EmailVerificationBanner
          email={user.email}
          loading={resendLoading}
          onResend={handleResendVerification}
        />
      )}

      <ProfileColumn>
        <ProfileEdit onPress={() => navigation.navigate('EditProfile')}>
          <ProfileText>Editar perfil</ProfileText>
        </ProfileEdit>
        {SHOW_PLACEHOLDER_ICONS && <Bookmark name="bookmark" size={24} color="black" />}
      </ProfileColumn>

      <View style={meStyles.settingsSection}>
        <TouchableOpacity
          style={meStyles.settingsHeader}
          onPress={() => setSettingsOpen(open => !open)}
          testID="settings-toggle"
        >
          <Text style={meStyles.sectionTitle}>Ajustes y legal</Text>
          <Ionicons
            name={settingsOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#aaa"
          />
        </TouchableOpacity>

        {settingsOpen && (
          <>
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
          </>
        )}
      </View>
      <Text style={meStyles.versionText}>
        QueVesVe!& v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Content>
  );

  return (
    <Container>
      <Header>
        {SHOW_PLACEHOLDER_ICONS && (
          <AntDesign
            style={{ position: 'absolute', left: 10, top: 10 }}
            name="user-add"
            size={24}
            color="black"
          />
        )}
        <Title>{user?.username ?? ''}</Title>
        {SHOW_PLACEHOLDER_ICONS && (
          <MaterialIcons name="arrow-drop-down" size={24} color="black" />
        )}
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
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE * 1.4,
              backgroundColor: '#1a1a1a',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={0.8}
            testID="me-video-cell"
            onPress={() =>
              user && navigation.navigate('VideoViewer', { userId: user.id, startIndex: index })
            }
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
          </TouchableOpacity>
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
  bioText: {
    fontSize: 12,
    color: '#8f8f91',
    paddingHorizontal: 10,
    marginTop: 2,
  },
  settingsSection: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
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

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';

type LegalRoute = RouteProp<RootStackParamList, 'Legal'>;

type Tab = 'terms' | 'privacy' | 'community';

const TABS: { key: Tab; label: string }[] = [
  { key: 'terms', label: 'Términos' },
  { key: 'privacy', label: 'Privacidad' },
  { key: 'community', label: 'Comunidad' },
];

const TERMS = `TÉRMINOS Y CONDICIONES DE QueVesVe!&
Última actualización: junio 2026

1. ACEPTACIÓN
Al crear una cuenta o usar QueVesVe!& ("la App"), aceptás estos Términos y Condiciones. Si no estás de acuerdo, no uses la App.

2. EDAD MÍNIMA
Debés tener al menos 13 años para usar la App. Si tenés entre 13 y 18 años, necesitás autorización de un adulto responsable.

3. TU CUENTA
Sos responsable de mantener la seguridad de tu contraseña y de toda actividad que ocurra en tu cuenta. Notificanos de inmediato ante cualquier uso no autorizado.

4. CONTENIDO DEL USUARIO
Vos sos el único responsable del contenido que subís. Al publicar contenido en la App, nos otorgás una licencia no exclusiva, gratuita y mundial para mostrar, distribuir y promocionar ese contenido dentro de la plataforma.

5. CONTENIDO PROHIBIDO
Está prohibido subir o compartir:
• Contenido ilegal o que infrinja derechos de terceros
• Material protegido por derechos de autor sin autorización
• Contenido sexual explícito o que involucre menores
• Contenido que incite al odio, discriminación o violencia
• Spam, información falsa o engañosa
• Datos personales de terceros sin consentimiento

6. DERECHOS DE AUTOR (COPYRIGHT)
Si creés que tu contenido fue subido sin tu permiso, podés reportarlo a: copyright@quevesve.app. Respondemos todas las denuncias dentro de 72 horas hábiles.

7. MODERACIÓN Y SUSPENSIÓN
Nos reservamos el derecho de eliminar contenido que viole estas normas y suspender o eliminar cuentas sin previo aviso ante infracciones graves o reiteradas.

8. LIMITACIÓN DE RESPONSABILIDAD
La App se provee "tal cual". No nos hacemos responsables por daños directos o indirectos derivados del uso de la plataforma o del contenido publicado por otros usuarios.

9. MODIFICACIONES
Podemos actualizar estos Términos. Te notificaremos dentro de la App. El uso continuado implica aceptación.

10. CONTACTO
Para consultas: soporte@quevesve.app`;

const PRIVACY = `POLÍTICA DE PRIVACIDAD DE QueVesVe!&
Última actualización: junio 2026

1. DATOS QUE RECOPILAMOS
• Datos de registro: nombre de usuario, email y contraseña (cifrada)
• Perfil: foto, bio, título profesional
• Contenido: videos que subís y tus interacciones (likes, comentarios)
• Datos de uso: vistas de videos, búsquedas, conversaciones directas
• Datos técnicos: dirección IP, tipo de dispositivo, sistema operativo

2. CÓMO USAMOS TUS DATOS
• Para mostrarte el feed y funciones de la App
• Para enviarte notificaciones y emails de verificación
• Para moderar contenido y garantizar la seguridad
• Para mejorar la experiencia de usuario

3. COMPARTIR CON TERCEROS
No vendemos tus datos personales. Podemos compartirlos únicamente:
• Con proveedores de infraestructura (servidores, almacenamiento) bajo contratos de confidencialidad
• Cuando la ley lo exija (órdenes judiciales, requerimientos legales)

4. ALMACENAMIENTO Y SEGURIDAD
Tus datos se almacenan en servidores seguros. Usamos conexiones cifradas (HTTPS) y contraseñas hasheadas.

5. TUS DERECHOS
Tenés derecho a:
• Acceder y corregir tus datos desde "Editar perfil"
• Eliminar tu cuenta y todos tus datos (ver sección "Eliminar cuenta" en tu perfil)
• Solicitar una copia de tus datos a: privacidad@quevesve.app

6. ELIMINACIÓN DE DATOS
Al eliminar tu cuenta, tus videos, comentarios, mensajes y datos personales serán eliminados de nuestros sistemas en un plazo máximo de 30 días.

7. COOKIES Y RASTREO
La App móvil no usa cookies. En versión web podrían usarse cookies técnicas esenciales.

8. MENORES DE EDAD
No recopilamos datos de menores de 13 años de forma deliberada. Si detectamos una cuenta de un menor, la eliminamos.

9. CONTACTO
Para ejercer tus derechos o hacer consultas: privacidad@quevesve.app`;

const COMMUNITY = `NORMAS DE LA COMUNIDAD QueVesVe!&
Última actualización: junio 2026

En QueVesVe!& queremos construir una comunidad creativa, respetuosa y segura. Estas normas aplican a todos los usuarios.

✅ LO QUE SÍ PODÉS HACER
• Compartir tus videos creativos y originales
• Interactuar respetuosamente con otros usuarios
• Reportar contenido que no cumpla estas normas
• Expresarte libremente dentro de los límites legales

❌ LO QUE NO ESTÁ PERMITIDO

CONTENIDO DAÑINO
• Videos con violencia extrema o gore
• Contenido que promueva autolesiones o suicidio
• Material que incite a conductas peligrosas

ODIO Y DISCRIMINACIÓN
• Discurso de odio basado en raza, género, orientación sexual, religión o discapacidad
• Acoso, bullying o amenazas a otros usuarios

CONTENIDO SEXUAL
• Material sexualmente explícito
• Cualquier contenido sexual que involucre menores (tolerancia cero)

DERECHOS DE AUTOR
• Subir canciones, películas o videos de terceros sin permiso
• Usar música comercial sin licencia
• Si tenés los derechos, podés usar el contenido libremente

SPAM E INFORMACIÓN FALSA
• Publicar spam o cadenas de mensajes
• Difundir noticias falsas que puedan causar daño

PRIVACIDAD
• Publicar datos personales de otros sin su consentimiento
• Grabar o compartir a personas sin su autorización

CONSECUENCIAS
Las violaciones pueden resultar en:
1. Eliminación del contenido
2. Advertencia al usuario
3. Suspensión temporal de la cuenta
4. Eliminación permanente de la cuenta

Para reportar contenido, usá el botón "Reportar" (ícono de bandera) en cualquier video.
Para denuncias de copyright: copyright@quevesve.app
Para soporte: soporte@quevesve.app`;

const CONTENT: Record<Tab, string> = {
  terms: TERMS,
  privacy: PRIVACY,
  community: COMMUNITY,
};

const Legal: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<LegalRoute>();
  const [activeTab, setActiveTab] = useState<Tab>(route.params?.tab ?? 'terms');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Legal</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.body}>{CONTENT[activeTab]}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  back: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#F5A623',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#F5A623',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  body: {
    fontSize: 13,
    lineHeight: 22,
    color: '#333',
  },
});

export default Legal;

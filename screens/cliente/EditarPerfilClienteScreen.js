import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const EditarPerfilClienteScreen = ({ navigation }) => {
  
  const [nombre, setNombre] = useState('Juan');
  const [apellido, setApellido] = useState('Pérez');
  const [telefono, setTelefono] = useState('78901234');
  const [correo, setCorreo] = useState('juan.perez@email.com');

  
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);

  
  const validarFormulario = () => {
    let nuevosErrores = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    }

    if (!apellido.trim()) {
      nuevosErrores.apellido = 'El apellido es obligatorio.';
    }

    
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo.trim()) {
      nuevosErrores.correo = 'El correo es obligatorio.';
    } else if (!regexEmail.test(correo)) {
      nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
    }

    
    if (!telefono.trim()) {
      nuevosErrores.telefono = 'El teléfono es obligatorio.';
    } else if (telefono.length < 8) {
      nuevosErrores.telefono = 'El teléfono debe tener al menos 8 dígitos.';
    }

    setErrores(nuevosErrores);
    
    return Object.keys(nuevosErrores).length === 0;
  };

  
  const handleGuardarPerfil = async () => {
    if (!validarFormulario()) return;

    setCargando(true);

    try {
      
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setCargando(false);

      
      Alert.alert(
        '¡Perfil Actualizado!',
        'Los datos personales se han guardado con éxito.',
        [{ text: 'Aceptar', onPress: () => navigation?.goBack() }]
      );
    } catch (error) {
      setCargando(false);
      Alert.alert('Error', 'No se pudieron guardar los cambios. Intenta de nuevo.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.titulo}>Editar Perfil</Text>
        <Text style={styles.subtitulo}>Actualiza tus datos personales básicos</Text>

        {/* Campo: Nombre */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={[styles.input, errores.nombre && styles.inputError]}
            value={nombre}
            onChangeText={(text) => {
              setNombre(text);
              if (errores.nombre) setErrores({ ...errores, nombre: null });
            }}
            placeholder="Tu nombre"
          />
          {errores.nombre && <Text style={styles.textError}>{errores.nombre}</Text>}
        </View>

        {/* Campo: Apellido */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Apellido *</Text>
          <TextInput
            style={[styles.input, errores.apellido && styles.inputError]}
            value={apellido}
            onChangeText={(text) => {
              setApellido(text);
              if (errores.apellido) setErrores({ ...errores, apellido: null });
            }}
            placeholder="Tu apellido"
          />
          {errores.apellido && <Text style={styles.textError}>{errores.apellido}</Text>}
        </View>

        {/* Campo: Teléfono */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono *</Text>
          <TextInput
            style={[styles.input, errores.telefono && styles.inputError]}
            value={telefono}
            onChangeText={(text) => {
              setTelefono(text);
              if (errores.telefono) setErrores({ ...errores, telefono: null });
            }}
            placeholder="Ej. 78901234"
            keyboardType="phone-pad"
          />
          {errores.telefono && <Text style={styles.textError}>{errores.telefono}</Text>}
        </View>

        {/* Campo: Correo Electrónico */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo Electrónico *</Text>
          <TextInput
            style={[styles.input, errores.correo && styles.inputError]}
            value={correo}
            onChangeText={(text) => {
              setCorreo(text);
              if (errores.correo) setErrores({ ...errores, correo: null });
            }}
            placeholder="ejemplo@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errores.correo && <Text style={styles.textError}>{errores.correo}</Text>}
        </View>

        {/* Botón de Guardar / Indicador Carga */}
        <TouchableOpacity
          style={[styles.botonGuardar, cargando && styles.botonDeshabilitado]}
          onPress={handleGuardarPerfil}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.textoBoton}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditarPerfilClienteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#212529',
  },
  inputError: {
    borderColor: '#DC3545',
  },
  textError: {
    color: '#DC3545',
    fontSize: 12,
    marginTop: 4,
  },
  botonGuardar: {
    backgroundColor: '#0D6EFD',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  botonDeshabilitado: {
    backgroundColor: '#80B5FF',
  },
  textoBoton: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
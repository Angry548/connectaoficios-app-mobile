import { createRoleTabs } from './createRoleTabs';
import HomeTrabajadorScreen from '../screens/trabajador/HomeTrabajadorScreen';
import PerfilTrabajadorScreen from '../screens/trabajador/PerfilTrabajadorScreen';
import MiPerfilProfesionalScreen from '../screens/trabajador/MiPerfilProfesionalScreen';
import EditarPerfilTrabajadorScreen from '../screens/trabajador/EditarPerfilTrabajadorScreen';
import MisServiciosScreen from '../screens/trabajador/MisServiciosScreen';
import CrearServicioScreen from '../screens/trabajador/CrearServicioScreen';
import EditarServicioScreen from '../screens/trabajador/EditarServicioScreen';
import DisponibilidadScreen from '../screens/trabajador/DisponibilidadScreen';
import ZonaCoberturaScreen from '../screens/trabajador/ZonaCoberturaScreen';
import SolicitudesRecibidasScreen from '../screens/trabajador/SolicitudesRecibidasScreen';
import DetalleSolicitudTrabajadorScreen from '../screens/trabajador/DetalleSolicitudTrabajadorScreen';
import NotificacionesTrabajadorScreen from '../screens/trabajador/NotificacionesTrabajadorScreen';
import PromocionesScreen from '../screens/trabajador/PromocionesScreen';
import DetallePromocionScreen from '../screens/trabajador/DetallePromocionScreen';
import PagoPromocionScreen from '../screens/trabajador/PagoPromocionScreen';
import HistorialPagosScreen from '../screens/trabajador/HistorialPagosScreen';
import ReputacionScreen from '../screens/trabajador/ReputacionScreen';
import ConversacionesScreen from '../screens/shared/ConversacionesScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';

export default createRoleTabs([
  { name: 'InicioTab', label: 'Inicio', icon: 'home', screens: [
    ['HomeTrabajador', HomeTrabajadorScreen],
    ['NotificacionesTrabajador', NotificacionesTrabajadorScreen],
    ['Promociones', PromocionesScreen],
    ['DetallePromocion', DetallePromocionScreen],
    ['PagoPromocion', PagoPromocionScreen],
    ['HistorialPagos', HistorialPagosScreen],
    ['Reputacion', ReputacionScreen],
  ] },
  { name: 'ServiciosTab', label: 'Servicios', icon: 'briefcase', initialRouteName: 'MisServicios', screens: [
    ['MisServicios', MisServiciosScreen],
    ['CrearServicio', CrearServicioScreen],
    ['EditarServicio', EditarServicioScreen],
    ['Disponibilidad', DisponibilidadScreen],
    ['ZonaCobertura', ZonaCoberturaScreen],
  ] },
  { name: 'SolicitudesTab', label: 'Solicitudes', icon: 'document-text', screens: [
    ['SolicitudesRecibidas', SolicitudesRecibidasScreen],
    ['DetalleSolicitudTrabajador', DetalleSolicitudTrabajadorScreen],
  ] },
  { name: 'MensajesTab', label: 'Mensajes', icon: 'chatbubbles', screens: [
    ['Conversaciones', ConversacionesScreen],
    ['Chat', ChatScreen],
  ] },
  { name: 'PerfilTab', label: 'Perfil', icon: 'person', screens: [
    ['PerfilTrabajador', PerfilTrabajadorScreen],
    ['MiPerfilProfesional', MiPerfilProfesionalScreen],
    ['EditarPerfilTrabajador', EditarPerfilTrabajadorScreen],
    ['ChangePassword', ChangePasswordScreen],
  ] },
]);

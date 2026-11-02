import { createRoleTabs } from './createRoleTabs';
import HomeClienteScreen from '../screens/cliente/HomeClienteScreen';
import AjustesClienteScreen from '../screens/cliente/AjustesClienteScreen';
import PerfilClienteScreen from '../screens/cliente/PerfilClienteScreen';
import EditarPerfilClienteScreen from '../screens/cliente/EditarPerfilClienteScreen';
import BuscarServiciosScreen from '../screens/cliente/BuscarServiciosScreen';
import DetalleServicioScreen from '../screens/cliente/DetalleServicioScreen';
import PerfilPublicoTrabajadorScreen from '../screens/cliente/PerfilPublicoTrabajadorScreen';
import ResenasTrabajadorScreen from '../screens/cliente/ResenasTrabajadorScreen';
import CrearResenaScreen from '../screens/cliente/CrearResenaScreen';
import RankingTrabajadoresScreen from '../screens/cliente/RankingTrabajadoresScreen';
import CrearSolicitudScreen from '../screens/cliente/CrearSolicitudScreen';
import MisSolicitudesScreen from '../screens/cliente/MisSolicitudesScreen';
import DetalleSolicitudClienteScreen from '../screens/cliente/DetalleSolicitudClienteScreen';
import NotificacionesClienteScreen from '../screens/cliente/NotificacionesClienteScreen';
import ConversacionesScreen from '../screens/shared/ConversacionesScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';

export default createRoleTabs([
  { name: 'InicioTab', label: 'Inicio', icon: 'home', screens: [
    ['HomeCliente', HomeClienteScreen],
    ['NotificacionesCliente', NotificacionesClienteScreen],
  ] },
  { name: 'BuscarTab', label: 'Buscar', icon: 'search', initialRouteName: 'BuscarServicios', screens: [
    ['BuscarServicios', BuscarServiciosScreen],
    ['DetalleServicio', DetalleServicioScreen],
    ['PerfilPublicoTrabajador', PerfilPublicoTrabajadorScreen],
    ['ResenasTrabajador', ResenasTrabajadorScreen],
    ['RankingTrabajadores', RankingTrabajadoresScreen],
  ] },
  { name: 'SolicitudesTab', label: 'Solicitudes', icon: 'document-text', screens: [
    ['MisSolicitudes', MisSolicitudesScreen],
    ['CrearSolicitud', CrearSolicitudScreen],
    ['DetalleSolicitudCliente', DetalleSolicitudClienteScreen],
    ['CrearResena', CrearResenaScreen],
  ] },
  { name: 'MensajesTab', label: 'Mensajes', icon: 'chatbubbles', screens: [
    ['Conversaciones', ConversacionesScreen],
    ['Chat', ChatScreen],
  ] },
  { name: 'PerfilTab', label: 'Perfil', icon: 'person', initialRouteName: 'AjustesCliente', screens: [
    ['AjustesCliente', AjustesClienteScreen],
    ['PerfilCliente', PerfilClienteScreen],
    ['EditarPerfilCliente', EditarPerfilClienteScreen],
    ['ChangePassword', ChangePasswordScreen],
  ] },
]);



// IMPORTACIÓN DE LIBRERÍAS / PAQUETES
const path = require('path'); 										// Modulo de nodejs para trabajar con rutas
const express = require('express'); 								// Modulo de nodejs para servir archivos de forma estática (imagenes, css, js)
const fs = require('fs'); 											// Modulo de nodejs para manejo de archivos
const net = require('net');											// Modulo de nodejs para manejo de sockets por protocolo TCP/IP
const BluetoothClassicSerialportClient = require('bluetooth-classic-serialport-client');    // Modulo de nodejs para el manejo del puerto serie (bt)
const {createBluetooth} = require('node-ble');						// Módulo de nodejs para el manejo de bluetooth LE

// Variables generales de sesión 
const therapyConfigPath = path.join(__dirname, 'config','therapySettings.json');  // Ruta del archivo que almacena la configuración de la sesión (Estos datos se reciben por websocket desde therapy_settings.js)
const PLOTSAMPLINGTIME = 100; 										// Frecuencia de envío de los datos recibidos del SW (peso y ROM) a therapy_monitoring.js. Este envío sucede a través de websockets
const VRSAMPLINGRATE = 50;											// Frecuencia de envío de los datos a la app de VR. Este envío sucede a través del protocolo TCP/IP, con un socket aboertp en el puerto 41235
var sockets = Object.create(null);        							// Variable donde se van a almacenar distintos sockets


////     VARIABLES GENERALES RELACIONADAS CON EL SW        ////
///////////////////////////////////////////////////////////////

const swBluetoothName = 'RNBT-4CEE'; 								// Nombre del dispositivo bluetooth del SW
const serial_swalker = new BluetoothClassicSerialportClient();      // socket bluetooth abierto para la conexión con SWalker
var is_swalker_connected = false;    								// variable que almacena el estado de la conexión bluetooth con SW. Por defecto: false: desconectado
var therapy_speed = 's';              								// Variable que almacena la velocidad a la que estáconfigurada la sesión. Por defecto: s: baja.
var direction_char = 's';			 								// Variable que almacena la dirección en la que se está moviendo el SWalker. Por defecto: s: stop.
var global_patient_weight = 1;		 								// Variable que almacena el peso del sujeto. Por defecto: 1   (kg) Esta variable se usa para calcular el % soportado.
var patient_leg_length = 0;          								// Variable que almacena la longitud de la pierna. Por defecto: 0 (cm). Esta variable es necesaria para el uso de la app de las huellas de VR.
// Las siguientes variables contienen rangos de movimiento reales.  No son necesarias, se han usado para el testeo de la app. 
var test_rom_right_vector = [36.5585, 36.5259, 36.4962, 36.4689, 36.4408, 36.3909, 36.335, 36.271, 36.1943, 36.0842, 35.9539, 35.8015, 35.6229, 35.3996, 35.1472, 34.8671, 34.5588, 34.2085, 33.8337, 33.4375, 33.021, 32.5716, 32.1055, 31.6253, 31.1309, 30.6092, 30.0759, 29.5333, 28.982, 28.4101, 27.8326, 27.2519, 26.6686, 26.0712, 25.4745, 24.881, 24.2907, 23.6928, 23.0991, 22.5103, 21.9251, 21.3314, 20.7416, 20.1566, 19.576, 18.9904, 18.4092, 17.8328, 17.26, 16.6806, 16.1042, 15.5317, 14.9625, 14.3888, 13.8194, 13.2551, 12.6957, 12.1344, 11.5788, 11.0296, 10.4863, 9.943, 9.4059, 8.8751, 8.35, 7.8256, 7.307, 6.7943, 6.2873, 5.782, 5.2825, 4.789, 4.3013, 3.8162, 3.3365, 2.8623, 2.3931, 1.9264, 1.4649, 1.0089, 0.55876, 0.11339, -0.32492, -0.75545, -1.1777, -1.592, -1.9966, -2.3906, -2.7733, -3.1449, -3.503, -3.8462, -4.1732, -4.483, -4.7732, -5.0422, -5.2883, -5.5107, -5.7056, -5.8703, -6.0025, -6.1013, -6.1635, -6.1873, -6.1715, -6.117, -6.0199, -5.8784, -5.691, -5.4588, -5.1776, -4.8459, -4.4624, -4.0296, -3.5434, -3.0028, -2.408, -1.7637, -1.0667, -0.31824, 0.47919, 1.3179, 2.1989, 3.1186, 4.0724, 5.0499, 6.0517, 7.0737, 8.1109, 9.1527, 10.2008, 11.2518, 12.3017, 13.3403, 14.3718, 15.3946, 16.4062, 17.397, 18.3728, 19.3328, 20.2749, 21.189, 22.0824, 22.9548, 23.805, 24.6222, 25.4163, 26.1884, 26.9377, 27.6538, 28.3466, 29.0165, 29.6621, 30.2707, 30.8549, 31.416, 31.9538, 32.4557, 32.9354, 33.3942, 33.8315, 34.2332, 34.613, 34.9714, 35.3072, 35.6047, 35.8803, 36.136, 36.3716, 36.5725, 36.7541, 36.9172, 37.0604, 37.1663, 37.2525, 37.3207, 37.3704, 37.3856, 37.3845, 37.3695, 37.3407, 37.2817, 37.2124, 37.1364, 37.0547, 36.9514, 36.8478, 36.7477, 36.6527, 36.5465, 36.4502, 36.367, 36.2969, 36.2222, 36.1618, 36.1168, 36.085, 36.046, 36.0174, 35.9986, 35.9863];
var test_rom_left_vector = [36.5585, 36.5259, 36.4962, 36.4689, 36.4408, 36.3909, 36.335, 36.271, 36.1943, 36.0842, 35.9539, 35.8015, 35.6229, 35.3996, 35.1472, 34.8671, 34.5588, 34.2085, 33.8337, 33.4375, 33.021, 32.5716, 32.1055, 31.6253, 31.1309, 30.6092, 30.0759, 29.5333, 28.982, 28.4101, 27.8326, 27.2519, 26.6686, 26.0712, 25.4745, 24.881, 24.2907, 23.6928, 23.0991, 22.5103, 21.9251, 21.3314, 20.7416, 20.1566, 19.576, 18.9904, 18.4092, 17.8328, 17.26, 16.6806, 16.1042, 15.5317, 14.9625, 14.3888, 13.8194, 13.2551, 12.6957, 12.1344, 11.5788, 11.0296, 10.4863, 9.943, 9.4059, 8.8751, 8.35, 7.8256, 7.307, 6.7943, 6.2873, 5.782, 5.2825, 4.789, 4.3013, 3.8162, 3.3365, 2.8623, 2.3931, 1.9264, 1.4649, 1.0089, 0.55876, 0.11339, -0.32492, -0.75545, -1.1777, -1.592, -1.9966, -2.3906, -2.7733, -3.1449, -3.503, -3.8462, -4.1732, -4.483, -4.7732, -5.0422, -5.2883, -5.5107, -5.7056, -5.8703, -6.0025, -6.1013, -6.1635, -6.1873, -6.1715, -6.117, -6.0199, -5.8784, -5.691, -5.4588, -5.1776, -4.8459, -4.4624, -4.0296, -3.5434, -3.0028, -2.408, -1.7637, -1.0667, -0.31824, 0.47919, 1.3179, 2.1989, 3.1186, 4.0724, 5.0499, 6.0517, 7.0737, 8.1109, 9.1527, 10.2008, 11.2518, 12.3017, 13.3403, 14.3718, 15.3946, 16.4062, 17.397, 18.3728, 19.3328, 20.2749, 21.189, 22.0824, 22.9548, 23.805, 24.6222, 25.4163, 26.1884, 26.9377, 27.6538, 28.3466, 29.0165, 29.6621, 30.2707, 30.8549, 31.416, 31.9538, 32.4557, 32.9354, 33.3942, 33.8315, 34.2332, 34.613, 34.9714, 35.3072, 35.6047, 35.8803, 36.136, 36.3716, 36.5725, 36.7541, 36.9172, 37.0604, 37.1663, 37.2525, 37.3207, 37.3704, 37.3856, 37.3845, 37.3695, 37.3407, 37.2817, 37.2124, 37.1364, 37.0547, 36.9514, 36.8478, 36.7477, 36.6527, 36.5465, 36.4502, 36.367, 36.2969, 36.2222, 36.1618, 36.1168, 36.085, 36.046, 36.0174, 35.9986, 35.9863];
var test_load_vector = [36.5585, 36.5259, 36.4962, 36.4689, 36.4408, 36.3909, 36.335, 36.271, 36.1943, 36.0842, 35.9539, 35.8015, 35.6229, 35.3996, 35.1472, 34.8671, 34.5588, 34.2085, 33.8337, 33.4375, 33.021, 32.5716, 32.1055, 31.6253, 31.1309, 30.6092, 30.0759, 29.5333, 28.982, 28.4101, 27.8326, 27.2519, 26.6686, 26.0712, 25.4745, 24.881, 24.2907, 23.6928, 23.0991, 22.5103, 21.9251, 21.3314, 20.7416, 20.1566, 19.576, 18.9904, 18.4092, 17.8328, 17.26, 16.6806, 16.1042, 15.5317, 14.9625, 14.3888, 13.8194, 13.2551, 12.6957, 12.1344, 11.5788, 11.0296, 10.4863, 9.943, 9.4059, 8.8751, 8.35, 7.8256, 7.307, 6.7943, 6.2873, 5.782, 5.2825, 4.789, 4.3013, 3.8162, 3.3365, 2.8623, 2.3931, 1.9264, 1.4649, 1.0089, 0.55876, 0.11339, -0.32492, -0.75545, -1.1777, -1.592, -1.9966, -2.3906, -2.7733, -3.1449, -3.503, -3.8462, -4.1732, -4.483, -4.7732, -5.0422, -5.2883, -5.5107, -5.7056, -5.8703, -6.0025, -6.1013, -6.1635, -6.1873, -6.1715, -6.117, -6.0199, -5.8784, -5.691, -5.4588, -5.1776, -4.8459, -4.4624, -4.0296, -3.5434, -3.0028, -2.408, -1.7637, -1.0667, -0.31824, 0.47919, 1.3179, 2.1989, 3.1186, 4.0724, 5.0499, 6.0517, 7.0737, 8.1109, 9.1527, 10.2008, 11.2518, 12.3017, 13.3403, 14.3718, 15.3946, 16.4062, 17.397, 18.3728, 19.3328, 20.2749, 21.189, 22.0824, 22.9548, 23.805, 24.6222, 25.4163, 26.1884, 26.9377, 27.6538, 28.3466, 29.0165, 29.6621, 30.2707, 30.8549, 31.416, 31.9538, 32.4557, 32.9354, 33.3942, 33.8315, 34.2332, 34.613, 34.9714, 35.3072, 35.6047, 35.8803, 36.136, 36.3716, 36.5725, 36.7541, 36.9172, 37.0604, 37.1663, 37.2525, 37.3207, 37.3704, 37.3856, 37.3845, 37.3695, 37.3407, 37.2817, 37.2124, 37.1364, 37.0547, 36.9514, 36.8478, 36.7477, 36.6527, 36.5465, 36.4502, 36.367, 36.2969, 36.2222, 36.1618, 36.1168, 36.085, 36.046, 36.0174, 35.9986, 35.9863];
// Variables utilizadas para la calibración del sw
var rom_left_calibration = 0     									// ROM pierna izquierda (sw) en el momento de la calibración (cuando se pulsa el botón desde therapy_monitoring)
var rom_right_calibration = 0;   									// ROM pierna derecha (sw) en el momento de la calibración (cuando se pulsa el botón desde therapy_monitoring)
var is_calibrated = false;       									// Booleano para indicar si la calibración se ha realzado. Esta variable se usa para realizar una calibración automática siempre que se conecta la VR
// Variables utilizadas para el almacenamiento de datos durante la sesión.
var record_therapy = false;
var rom_left = 0;            										// Variable utilizada para el almacenamiento del dato de ROM pierna izquierda (sw)
var rom_right= 0;            										// Variable utilizada para el almacenamiento del dato de ROM pierna izquierda (sw)
var load = 0;               										// Variable utilizada para el almacenamiento del dato de ROM pierna izquierda (sw)
var time_stamp_vector = [];  										// lista que almacena todos los timestamps de los datos recibidos entre el inicio y fin de la sesón.
var rom_left_vector = []     										// lista que almacena todos los datos de ROM pierna izquierda (sw) recibidos entre el inicio y fin de la sesón.
var rom_right_vector = []    										// lista que almacena todos los datos de ROM pierna derecha (sw) recibidos entre el inicio y fin de la sesón.
var load_vector = []         										// lista que almacena todos los datos de porcentaje (%) de peso soportado calculados entre el inicio y fin de la sesón.
var direction_vector = [];  										// lista que almacena todos los datos de dirección del sw recibidos entre el inicio y fin de la sesón.


//     VARIABLES GENERALES PARA LA RECEPCIÇON DE EMG EMGdataAcquisition.py     //
/////////////////////////////////////////////////////////////////////////////////

const client_delsys_start = new net.Socket();        				// socket abierto para el envío de comandos al software EMGdataAcquisition.py
const client_delsys_data = new net.Socket();         				// socket abierto para la recepción de datos de EMG desde el software EMGdataAcquisition.py
const DELSYS_PC_IP = '192.168.43.9';               				// Variable que almacena la IP del ordenador desde el cual se lanzan el TCU (delsys) y el software EMGdataAcquisition.py
const DELSYS_START_PORT = 30000;                     				// Variable que almacena el puerto destinado al socket de envío de comandos a EMGdataAcquisition.py
const DELSYS_DATA_PORT = 30002;                      				// Variable que almacena el puerto destinado al socket de recepción de datos de EMG desde EMGdataAcquisition.py
var is_delsys_connected = false;                     				// Variable que almacena el estado de conexión del software EMGdataAcquisition.py
var emg_msg = "";    												// Variable donde se almacena el último mensaje de EMG recibido desde EMGdataAcquisition.py, y que es enviado a therapy_monitoring.js para la representación en tiempo real


//   VARIABLES GENERALES PARA LA RECEPCIÓN DE DATOS DE ACELEROMETRO  (TCU - DELSYS) //
//////////////////////////////////////////////////////////////////////////////////////
const client_delsys_acc = new net.Socket();                         // socket abierto para la recepción de datos de acelerómetro 
const delsys_acc_port = 50042;                                      // Variable que almacena el puerto destinado al socket de recepción de datos de acelerómetro
var index_channel = 1;												// Variable que almacena un índice para controlarel sensor al que pertenece cada dato de acelerometro.
var acc_all_data = [];                                              // Lista de los 24 datos de acelerómetro (8 sensores x 3 ejes) [s1X, s1Y, s1Z, s2X, s2Y, s2Z, ...]
var s1_accX = 0; 												    // Variable que almacena el dato de acelerómetro del sensor 1 eje X
var s1_accY = 0;													// Variable que almacena el dato de acelerómetro del sensor 1 eje Y
var s1_accZ = 0;													// Variable que almacena el dato de acelerómetro del sensor 1 eje Z
var s2_accX = 0;													// Variable que almacena el dato de acelerómetro del sensor 2 eje X
var s2_accY = 0;													// Variable que almacena el dato de acelerómetro del sensor 2 eje Y
var s2_accZ = 0;													// Variable que almacena el dato de acelerómetro del sensor 2 eje Z
var s3_accX = 0;													// Variable que almacena el dato de acelerómetro del sensor 3 eje X
var s3_accY = 0;													// Variable que almacena el dato de acelerómetro del sensor 3 eje Y
var s3_accZ = 0;													// Variable que almacena el dato de acelerómetro del sensor 3 eje Z
var s4_accX = 0;													// Variable que almacena el dato de acelerómetro del sensor 4 eje x
var s4_accY = 0;													// Variable que almacena el dato de acelerómetro del sensor 4 eje y
var s4_accZ = 0;													// Variable que almacena el dato de acelerómetro del sensor 4 eje z
var s5_accX = 0;													// Variable que almacena el dato de acelerómetro del sensor 5 eje X
var s5_accY = 0;													// Variable que almacena el dato de acelerómetro del sensor 5 eje y
var s5_accZ = 0;													// Variable que almacena el dato de acelerómetro del sensor 5 eje z
var s6_accX = 0;													// Variable que almacena el dato de acelerómetro del sensor 6 eje X
var s6_accY = 0;													// Variable que almacena el dato de acelerómetro del sensor 6 eje y				
var s6_accZ = 0;													// Variable que almacena el dato de acelerómetro del sensor 6 eje z
var s7_accX = 0;													// Variable que almacena el dato de acelerómetro del sensor 7 eje X
var s7_accY = 0;													// Variable que almacena el dato de acelerómetro del sensor 7 eje y
var s7_accZ = 0;													// Variable que almacena el dato de acelerómetro del sensor 7 eje Z
var s8_accX = 0;													// Variable que almacena el dato de acelerómetro del sensor 8 eje X
var s8_accY = 0;													// Variable que almacena el dato de acelerómetro del sensor 8 eje Y
var s8_accZ = 0;													// Variable que almacena el dato de acelerómetro del sensor 8 eje Z
var acc_rom_hip_vector = [] 										// lista que almacena los datos de ROM calculados a partir de acc Recto femoral (derecha e izquierda)
var rom_hip_r = 0													// Variable que almacena el dato de rom pierna derecha calculado a partir de acc
var rom_hip_l = 0													// Variable que almacena el dato de rom pierna izquierda calculado a partir de acc			
var rom_hip_r_cal = 0;												// Variable que almacena el dato de rom pierna derecha calculado a partir de acc en el momento de la calibración
var rom_hip_l_cal = 0;												// Variable que almacena el dato de rom pierna izquierda calculado a partir de acc en el momento de la calibración

////  VARIABLES GENERALES PARA LA CONEXIÓN CON LAS GAFAS DE VR   ////
/////////////////////////////////////////////////////////////////////
var tcpServer_VR = net.createServer();       						// socket creado para el envío de datos de rom y longitud de pierna a la app de VR
var vr_port = 41235;												// Variable que almacena el puerto destinado al socket de envío de datos a las gafas de VR
var is_client_connected = false;									// Variable que almacena el estado de conexión del socket de envío de datos a VR
var vr_ready = false; 												// Variable que almacena si el comando #ready se ha recibido correctamente.

////  VARIABLES GENERALES PARA LA CONEXIÓN BLE   ////
/////////////////////////////////////////////////////////////////////
const {bluetooth, destroy} = createBluetooth();
var characteristic_object = null;
var device_object = null;
var is_ble_connected = false;
var ble_macAddr = "XX:XX:XX:XX:XX"
var ble_service = "49535343-fe7d-4ae58fa99fafd205e455"
var ble_characteristic = "49535343-1e4d-4bd9-ba61-23c647249616"
var emg1_vector = []
var emg2_vector = []
var emg1 = 0;
var emg2 = 0;

//  VARIABLES GENERALES RELACIONADAS CON EL PARSEO DE DATOS RECIBIDOS 
var is_first_data = [true, true, true, true];   //sw, imu1, imu2, imu3.  Esta variable se utiliza como input, en la función hex2a, para descartar el primer mensaje (por si no llega completo). 




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////                                                               RECEPCIÓN DE DATOS DEL SW A TRAVÉS DEL SOCKET DE BLUETOOTH                                                           ///////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// la función descrita a continuación se ejecuta automáticamente cada vez que se recibe un nuevo dato a través del socket de conexión con el SWalker

var ascii_msg;
var lasthex_sw = "";
var msecondsFromLastMessage_swalker = 0;    // variable para controlar los milisegundos que han pasado desde la recepción del ultimo dato. Objetivo: Control del estado del socket, en caso de que no se reciba el mensaje de fallo de socket.
serial_swalker.on('data', function(data){ 
	// Actualizamos los milisegundos desde la recepción del último mensaje
	msecondsFromLastMessage_swalker = 0;
	// parseamos el string de datos recibido en una lista de mensajes
    ascii_msg = hex2a_general(data, lasthex_sw, is_first_data[0]);      // ascii_msg = lista de los mensajes individuales recibidos
    is_first_data[0] = ascii_msg[1];                                    // Actualizamos el booleano que indica si se trata, o no, del primer dato recibido. 
    
    // parseo de los valores de interes, y almacenamiento en caso de que se esté realizando una sesión.
    let msg_list_sw = ascii_msg[0];
    for(i=0; i < msg_list_sw.length; i++){
		if(msg_list_sw[i].includes("=") & msg_list_sw[i].includes(',')){
			let data_vector = msg_list_sw[i].split('=')[1].split(',');     // parseamos cada uno de los mensajes recibidos y nos quedamos únicamente con la lista de datos de interés. 
			if(data_vector.length == 4){	
				// Data storage
				rom_left = parseFloat(data_vector[2]);
				rom_right = parseFloat(data_vector[1]);
				load = parseFloat(data_vector[0]);
				lasthex_sw = "";
				
				if (record_therapy){
					// Se almanenan los datos en una lista únicamente si el delsys no ha sido útilizado. En el caso contrario, el almacenamiento lo marca la recepción de datos del delsys (acelerometros).
					// Esto se ha planteado así para no perder datos del delsys (frec delsys: 148Hz; frec sw: 10Hz)
					if(! is_delsys_connected){
						// swalker data
						rom_left_vector.push(parseFloat(rom_left-rom_left_calibration));
						rom_right_vector.push(parseFloat(rom_right-rom_right_calibration));
						load_vector.push(((parseFloat(load)/global_patient_weight)*100).toFixed(2));
						time_stamp_vector.push(Date.now());
						direction_vector.push(direction_char);
					}
				}
				
			} else {
				// Si la cadena recibida no se corresponde con la que debería ser, guardamos este string. El próximo mensaje recibido será añadido a este.
				lasthex_sw = '#' + msg_list_sw[i]
			}
		} else {
			// Si la cadena recibida no se corresponde con la que debería ser, guardamos este string. El próximo mensaje recibido será añadido a este.
			lasthex_sw = '#' + msg_list_sw[i]
		}
				
	}
}); 

// Por definición, la librería utilizada para la conexión bluetooth emite un mensaje "closed" si se ha detectado el cierre del socket en el otro extremo. Es decir, si el SWalker ha sido apagado.
serial_swalker.on('closed', function(){
	console.log("connection closed");  
	// Se emite un mensaje de estado de conexión a therapy_monitoring, para que modifique los atributos del botón de conexión del sw
	sockets['websocket'].emit('monitoring:connection_status',{
		 device: "sw",
		 status:3
	})
	// Se realiza la desconexión/cierre del socket abierto para la conexión con sw
	disconnect_bt_device(sockets['websocket'], serial_swalker, is_swalker_connected, "sw")

})



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////                                                          RECEPCIÓN DE DATOS DE EMG DESDE EMGdataAcquisition.py -  SOCKET TCP/IP                                                    ///////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// la función descrita a continuación se ejecuta automáticamente cada vez que se recibe un nuevo mensaje de datos a través del socket habilitado para la recepción de datos enviados desde el software EMGdataAcquisition.py (puerto 30002)

var received_data = "";
var msecondsFromLastMessage_delsys = 0    // variable que almacena los milisegundos que han pasado desde la recepción del ultimo dato. Objetivo: Control del estado del socket, en el caso de que no se reciba correctamente el mensaje de fallo.
client_delsys_data.on('data', function(data) {
    var datos = data.toString();
    // Actualizamos los milisegundos desde la recepción del último mensaje
    msecondsFromLastMessage_delsys = 0
    for (let index = 0; index < datos.length; index++) {
		received_data = received_data + datos.charAt(index);
		// parseo del mensaje recibido para separar los JSON recibidos, por si hubiera más de uno. En ese caso, almacenamos únicamente un mensaje y prescindimos de los que hubiera a continuación.
		if (datos.charAt(index) == '}') {
			emg_msg = received_data;
			received_data = "";
        }
    }
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////                                                                 RECEPCIÓN DE DATOS DE ACC DESDE EL TCU -  SOCKET TCP/IP                                                            ///////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// la función descrita a continuación se ejecuta automáticamente cada vez que se recibe un nuevo mensaje de datos a través del socket habilitado para la recepción de datos enviados desde el TCU-Delsys (puerto 50042)

client_delsys_acc.on('data', function(msg) {
    var len = Buffer.byteLength(msg)
    index_channel = decodeFloat(msg, index_channel);    // El dato de acc se recibe en forma de 4 bytes. La función decodeFloat se encarga de la conversión bytes -> Float, y de mantener el orden de sensores
    if (record_therapy){
		// Almacenamos los datos en una lista, que posteriormente será volcada en la base de datos.    //148 hz
		time_stamp_vector.push(Date.now());
		
		// Almacenamiento de los datos del SW. Si no se encuentra conectado, se almacenarán 0s
		rom_left_vector.push(parseFloat(rom_left-rom_left_calibration));
		rom_right_vector.push(parseFloat(rom_right-rom_right_calibration));
		load_vector.push(((parseFloat(load)/global_patient_weight)*100).toFixed(2));
		direction_vector.push(direction_char);
		
		// acc
		// acc_all_data es una variable que almacena lo datos que serán descargados en forma de csv una vez finalizada la sesión 
		acc_all_data.push([s1_accX, s1_accY, s1_accZ, s2_accX, s2_accY, s2_accZ, s3_accX, s3_accY, s3_accZ, s4_accX, s4_accY, s4_accZ, s5_accX, s5_accY, s5_accZ, s6_accX, s6_accY, s6_accZ,s7_accX, s7_accY, s7_accZ, s8_accX, s8_accY, s8_accZ])
		// acc_rom_hip_vector almacena los datos calculados de rom a partir del acelerómetro, que serán almacenados en la base de datos junto con los datos del sw.
		acc_rom_hip_vector.push([rom_hip_r, rom_hip_l])		    
	}
    
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////                                                               RECEPCIÓN DE MENSAJES DEL SOCKET DE VR - TCP/IP                                                                      ///////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

tcpServer_VR.listen(vr_port);      // asignación del puerto de VR al socket TCP/IP crreado para la comunicación.
console.log("listening on server 41235 - VR");    // traza queindica que el socket se encuentra abierto

// Lectura del archivo .json de configuración de sesión para extraer el dato de la longitud de pierna del paciente
fs.readFile(therapyConfigPath, (err, data) => {
    if (err) throw err;
    var config = JSON.parse(data);
    console.log(config)
    patient_leg_length = config.leg_length;
});

// la función descrita a continuación se ejecuta automáticamente cada vez que se detecta una nueva conexión en el socket de VR (purto 41235)
tcpServer_VR.on('connection', function(socket){
	
	sockets['VR_socket'] = socket;
	
	// Websocket: Envío del mensaje de estado de la conexión a therapy_monitoring para que actualice los atributos del botón de VR. (este botón está deshabilitado, pero sin embargo, al detectar apertura o cierre de conexión, cambia de color como indicativo)
	sockets['websocket'].emit('monitoring:connection_status',{
		device: "vr",
		status:0
	});
               
	//nos aseguramos que se calibra el ROM al conectar la gafa
	is_calibrated = false;
	configureStartPos()    // Llamada a la función de calibración del ROM

	console.log('There is a new connection !!');
	// Actualización del estado de conexión 
	is_client_connected = true; 
	 
	// la función descrita a continuación se ejecuta automáticamente cada vez que se recibe un nuevo mensaje a través del socket conectado creado para la VR (puerto 41235) 
	socket.on('data',function(data){
	// Esperamos el mensaje #ready, por parte de la app de VR, para iniciar el envío de los datos
	if (data.toString() == "#ready"){
		// Creación de un timer que ejecuta el envío a la frecuencia de VR.
		var timer = setInterval(function () {
			if(is_client_connected){
				// El envio no comienza hasta que no se ha realizado la calibración
				if( is_calibrated){      
					if(is_swalker_connected){
						        var msg = ((rom_right-parseFloat(rom_right_calibration)).toFixed(2)).toString() + "|" + ((rom_left-parseFloat(rom_left_calibration)).toFixed(2)).toString() + "|" + patient_leg_length.toString() + "|" 
                                socket.write(msg)
						}
					}
				} else{
					clearInterval(timer)
				}
			}, VRSAMPLINGRATE);
	   }
	});
	// la función descrita a continuación se ejecuta automáticamente si se produce un error dentro del socket. Si eso sucede, se envía un mensaje por websocket a therapy_monitoring ppara que actualice el botón de VR
	socket.on('error', function(ex) {
		console.log(ex);
		is_client_connected = false;
		sockets['websocket'].emit('monitoring:connection_status',{
               device: "vr",
               status:1});
	});
	// la función descrita a continuación se ejecuta automáticamente si el otro lado finaliza la conexión. Si eso sucede, se envía un mensaje por websocket a therapy_monitoring ppara que actualice el botón de VR
	socket.on('end', function() {
		console.log('VR data ended');
		is_client_connected = false
		sockets['websocket'].emit('monitoring:connection_status',{
               device: "vr",
               status:1});
	});
	// la función descrita a continuación se ejecuta automáticamente si el otro lado finaliza la conexión. Si eso sucede, se envía un mensaje por websocket a therapy_monitoring ppara que actualice el botón de VR
	socket.on('close', function() {
		console.log('VR data closed');
		is_client_connected = false;
		sockets['websocket'].emit('monitoring:connection_status',{
               device: "vr",
               status:1});
	});
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////                                                                                      WEBSERVER                                                                                     ///////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////
//** Webserver configuration **//
/////////////////////////////////
//
// Express initialization SWalker
const app = express();
app.set('port', process.env.PORT || 3000)
// Send static files
app.use(express.static(path.join(__dirname, 'public')));
// Configure PORT of the web
const server = app.listen(app.get('port'), () => {
    console.log('Server', app.get('port'));
})

/////////////////////////////////
//** Socket io configuration **//
/////////////////////////////////
// Socket io is the javascript library used for the
// realtime, bi-directional communication between web
// clients and servers.
//
// Give the server to socketio
const SocketIO = require('socket.io');
const io = SocketIO(server);

////////////////////////////////
//** Database configuration **//
////////////////////////////////
//
var mysql = require('mysql');

////////////////////////////////////
//** Export .xlsx configuration **//
////////////////////////////////////
//
const ExcelJS = require('exceljs');
const { parse } = require('path');
// Identificators database files 
var data_session_id;

///////////////////////////////////////
//*** Server-Client communication ***//
///////////////////////////////////////
//
// Conexión con la base de datos swdb
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "mysql",
    database: "swdb",
    multipleStatements: true
});

// conexión io - websockets.   Servidor web (index.jx) - Cliente web (therapy_monitoring.js/users.js/therapy_settings.js)
io.on('connection', (socket) => {
    console.log('new connection', socket.id);
    sockets['websocket'] = socket;
    
    var datitos=[];
    
    // Mensaje enviado desde users.js al iniciar la conexión. Su función es trasladarle al mismo la informción guardada en la bse de datos.
    // Este mensaje desencadena el envío, a modo de respuesta, de 4 mensajes dirigidos a users.js.
    socket.on('refreshlist',function() {
        console.log("Connected!");
        console.log("Connected Sessions!");
        var sql = "SELECT * FROM tabla_sesion JOIN tabla_pacientes ON tabla_sesion.idPaciente = tabla_pacientes.idtabla_pacientes";
        con.query(sql, function (err, sessions_data) {
            if (err) throw err;
            socket.emit('datostabla', sessions_data);   //session_data --- datos de las sesiones (configuraciones)
        });
        console.log("Connected Patient!");
        var sql = "SELECT * FROM tabla_pacientes";
        con.query(sql, function (err, patients_list) {
            if (err) throw err;
            socket.emit('patientdata', patients_list);  //patients_list ----- lista de pacientes(id-nombre-apellido)
        });
        console.log("Connected Therapist!");
        var sql = "SELECT * FROM tabla_terapeutas";
        con.query(sql, function (err, therapist_list) {
            if (err) throw err;
            socket.emit('therapistdata', therapist_list);     //therapist_list ---- Lista de Terapeutas, id-nombre-apellido-centro
        });
        var sql = "SELECT * FROM data_sessions";
        con.query(sql, function (err, datasessions_list) {
            if (err) throw err;
            socket.emit('datasessions', datasessions_list);    
        });
        
        
    })

    //DELETE PATIENT DATABASE (users.js)
    socket.on('deleted_patient', function(iddeleted) {
        var sql = "DELETE FROM tabla_pacientes WHERE idtabla_pacientes="+iddeleted;
        con.query(sql, function (err, result) {
            console.log("Deleted Patient");
        });
    });

    //EDIT PATIENT DATABASE (users.js)
    socket.on('edit_patient', function(editpat) {
		console.log(editpat)
        var sql = 'UPDATE tabla_pacientes SET NombrePaciente = ?, ApellidoPaciente = ?, patiente_age = ?, patiente_weight = ?, leg_length = ?, estado_fisico = ?, estado_cognitivo = ?, surgery = ?, hip_joint = ?, patient_height = ?, patient_active_rom = ?, patient_gender = ?  WHERE (idtabla_pacientes=?)'
        con.query(sql,[editpat.NombrePaciente,editpat.ApellidoPaciente,editpat.patiente_age, editpat.patiente_weight, editpat.leg_length, editpat.estado_fisico, editpat.estado_cognitivo, editpat.surgery, editpat.hip_joint, editpat.patient_height, editpat.patient_active_rom, editpat.patient_gender, editpat.idtabla_pacientes], function (err, result) {
            console.log("Edited Patient");
        });
    });
    // ADD PATIENT IN DATABASE (users.js)
    socket.on('insertPatient', function(patient) {
        var sql = "INSERT INTO tabla_pacientes (NombrePaciente, ApellidoPaciente, patiente_age, patiente_weight, leg_length, estado_fisico, estado_cognitivo, surgery, hip_joint, patient_height, patient_active_rom, patient_gender) VALUES (?)";
        con.query(sql,[patient], function (err, result) {
            if (err) throw err;
            console.log("1 record Patient");
        });
    });

    //DOWNLOAD PATIENT LIST (DATABASE)    (users.js)
    socket.on('download_patients',function(res){
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('My Sheet');
        worksheet.columns = [
            { header: 'Id Patient', key: 'idtabla_pacientes', width: 10 },
            { header: 'First Name', key: 'NombrePaciente', width: 10 },
            { header: 'Last Name', key: 'ApellidoPaciente', width: 10 },
            { header: 'Gender', key: 'patient_gender', width: 10 },
            { header: 'Age', key: 'patiente_age', width: 10 },
            { header: 'Weight (kg)', key: 'patiente_weight', width: 10 },
            { header: 'Height (cm)', key: 'patient_height', width: 10 },
            { header: 'Leg Lenth (cm)', key: 'leg_length', width: 10 },
            { header: 'Max Active ROM (º)', key: 'patient_active_rom', width: 10 },
            { header: 'Physical Status', key: 'estado_fisico', width: 10 },
            { header: 'Cognitive Status', key: 'estado_cognitivo', width: 10 },
            { header: 'Type of Surgery', key: 'surgery', width: 10 },
            { header: 'Affected Hip Joint', key: 'hip_joint', width: 10 }
        ];
        var sql = "SELECT * FROM tabla_pacientes";
        con.query(sql, function (err, patients_list) {
            if (err) throw err;
            datitos=patients_list;
                for (var i = 0; i < patients_list.length; i++) {
                    worksheet.addRow((patients_list[i]));
                }
            workbook.xlsx.writeFile("Patients_DB.xlsx");
        });
    })

    // ADD THERAPIST IN DATABASE (users.js)
    socket.on('insertTherapist', function(therapist) {
        var sql = "INSERT INTO tabla_terapeutas (NombreTerapeuta, ApellidoTerapeuta, Centro) VALUES (?)";
        con.query(sql,[therapist], function (err, result) {
            if (err) throw err;
            console.log("1 record Therapist");
        });
    });

    //EDIT THERAPIST DATABASE (users.js)
    socket.on('edit_therapist', function(editpat) {
        var sql = 'UPDATE tabla_terapeutas SET NombreTerapeuta = ?, ApellidoTerapeuta = ?, Centro = ?  WHERE (idtabla_terapeutas=?)'
        con.query(sql,[editpat.NombreTerapeuta,editpat.ApellidoTerapeuta, editpat.Centro,editpat.idtabla_terapeutas], function (err, result) {
            console.log("Edited therapist");
        });
    });

    //DELET THERAPIST DATABASE (users.js)
    socket.on('deleted_therapist', function(iddeleted) {
        var sql = "DELETE FROM tabla_terapeutas WHERE idtabla_terapeutas="+iddeleted;
        con.query(sql, function (err, result) {
            console.log("Delet Therapist");
        });
    });

    //DOWNLOAD PATIENT LIST (DATABASE) (users.js)
    socket.on('download_therapist',function(res){
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Therapists');
        worksheet.columns = [
            { header: 'Id Therapist', key: 'idtabla_terapeutas', width: 10 },
            { header: 'First Name', key: 'NombreTerapeuta', width: 10 },
            { header: 'Last Name', key: 'ApellidoTerapeuta', width: 10 }
        ];
        var sql = "SELECT * FROM tabla_terapeutas";
        con.query(sql, function (err, therapist_list) {
            if (err) throw err;
                for (var i = 0; i < therapist_list.length; i++) {
                    worksheet.addRow((therapist_list[i]));
                }
            workbook.xlsx.writeFile("Therapists_DB.xlsx");
        });
    })

    // ADD SESSIONS DATA IN DATABASE  (therapy_monitoring.js)
    socket.on('addsesiondata', function(data) {
		/*
        rom_left_vector = test_rom_left_vector
        rom_right_vector = test_rom_right_vector
        load_vector = test_rom_left_vector
        time_stamp_vector = test_rom_left_vector
		is_swalker_connected = true;		*/				

        console.log("Add session data")
        // Read therapy configuration from conf file
        fs.readFile(therapyConfigPath, (err, data) => {
            if (err) throw err;
            console.log(data);
	    // los datos de configuración procedentes de un JSON son parseados y almacenados en la variable config
            var config = JSON.parse(data);
            var terapist_id = "SELECT idtabla_terapeutas from tabla_terapeutas where NombreTerapeuta in ('" + (config.therapist_name.split(" "))[0] +"') AND ApellidoTerapeuta in ('" + (config.therapist_name.split(" "))[1] +"'); ";
            var patient_id = "SELECT idtabla_pacientes from tabla_pacientes where NombrePaciente in ('" + (config.patient_name.split(" "))[0] +"') AND ApellidoPaciente in ('" + (config.patient_name.split(" "))[(config.patient_name.split(" ").length) -1] +"'); ";
            var IDs = terapist_id + patient_id
	    // SQL get patient and therapist id
            con.query(IDs , [1,2], function (err, result) {
                if (err) throw err;
				console.log(result)
                patient_id = result[1][0].idtabla_pacientes;
                terapist_id = result[0][0].idtabla_terapeutas;
                patient_leg_length = config.leg_length;
                var n_session = "SELECT COUNT(NumberSession) AS count from tabla_sesion WHERE idPaciente =" + patient_id + ";"
		// SQL get patient session id
                con.query(n_session, function (err, result) {
		    if (err) throw err;
		    n_session = result[0].count +1;
		    // Definición de una variable con los datos necesarios para añadir la configuración de sesión a la base de datos
		    var sessionConfig = [patient_id, n_session, terapist_id, config.gait_velocity, config.observations]; 
		    var surgery = config.surgery;
		    var sql = "INSERT INTO tabla_sesion (idPaciente, NumberSession, idTerapeuta, gait_velocity, observations) VALUES (?)";
		    con.query(sql,[sessionConfig], function (err, result) {
			    if (err) throw err;
			    // Save Data of the session
			    var sessionID = "SELECT idtable_session from tabla_sesion ORDER BY idtable_session DESC LIMIT 1;";
			    con.query(sessionID , function (err, sessionID) {
				    if (err) throw err;
				    // Get last session ID
				    sessionID = sessionID[0].idtable_session;
				    var insertDataRows = ""
				    // El almacenamiento de los datos durante la ssesión, en las listas, se ha realizado a la frecuencia del delsys (148Hz). En caso de no estar conectado, el almacenamiento ha sido a la frecuencia del sw (10Hz).  
				    if (is_swalker_connected){
					    var total_length = rom_right_vector.length;
				    } else if (is_delsys_connected){
					    var total_length = acc_rom_hip_vector.length;
				    } 
				    
				    // Se recorren las listas de dats aádiendo las muestras una a una como filas a la tabla de datos dde la bbdd.
				    for (let index = 0; index < total_length; index++) {
					// Redefinición del valor de la variale de dirección del SW.
					if(is_swalker_connected){
						if (direction_vector[index] == 's'){
							var dir_vector =  0;
						} else if (direction_vector[index] == 'b'){
							var dir_vector = 1;
						} else if (direction_vector[index] == 'f'){
							var dir_vector = 2;
						} else if (direction_vector[index] == 'r'){
							var dir_vector = 3;
						} else if (direction_vector[index] == 'l'){
							var dir_vector = 4;
						} else {
							var dir_vector = 5;
						}
					}    
					
					// Redefinición de la peticion SQL para cada muestra de los datos a añadir.
					if ((is_swalker_connected & is_delsys_connected)) {
						
						insertDataRows = "(" + (sessionID).toString() + "," + (time_stamp_vector[index]).toString() +","+ 
										(rom_left_vector[index]).toString() + "," + (rom_right_vector[index]).toString()  + "," + (load_vector[index]).toString() + "," + (dir_vector).toString() +  "," + 
										//(emg_activity_vector[index][0]).toString() + "," + (emg_binary_activation_vector[index][0]).toString() + "," + (emg_activity_vector[index][1]).toString() + "," + (emg_binary_activation_vector[index][1]).toString() +  "," + (emg_activity_vector[index][2]).toString()  + "," + (emg_binary_activation_vector[index][2]).toString()+  "," + (emg_activity_vector[index][3]).toString()  + "," + (emg_binary_activation_vector[index][3]).toString() +  "," + (emg_activity_vector[index][4]).toString()  + "," + (emg_binary_activation_vector[index][4]).toString() +  "," + (emg_activity_vector[index][5]).toString()  + "," + (emg_binary_activation_vector[index][5]).toString() +  "," + (emg_activity_vector[index][6]).toString()  + "," + (emg_binary_activation_vector[index][6]).toString()+  "," + (emg_activity_vector[index][7]).toString()  + "," + (emg_binary_activation_vector[index][7]).toString() + 
										//tibiaL_accX_vector[index].toString() + "," + tibiaR_accX_vector[index].toString() +  ");"
										acc_rom_hip_vector[index][1].toString() + "," + acc_rom_hip_vector[index][0] + ");"
						//var sql = "INSERT INTO data_sessions (idSesion, Date, left_hip, right_hip, weight_gauge, direction, emg_muscle_activity_s1,  muscle_binary_activation_s1, emg_muscle_activity_s2,  muscle_binary_activation_s2, emg_muscle_activity_s3,  muscle_binary_activation_s3,  emg_muscle_activity_s4,  muscle_binary_activation_s4,  emg_muscle_activity_s5,  muscle_binary_activation_s5, emg_muscle_activity_s6,  muscle_binary_activation_s6, emg_muscle_activity_s7,  muscle_binary_activation_s7, emg_muscle_activity_s8, muscle_binary_activation_s8, accX_s7, accY_s7, accZ_s7, accX_s3, accY_s3, accZ_s3) VALUES " + insertDataRows;
						var sql = "INSERT INTO data_sessions (idSesion, Date, left_hip, right_hip, weight_gauge, direction, accX_s7, accX_s3) VALUES " + insertDataRows;
						
						
					
					
					} else if(is_delsys_connected){
						// emg connected. No swalker.
						insertDataRows = "(" + (sessionID).toString() + "," + (time_stamp_vector[index]).toString() +","+ 
										//(emg_activity_vector[index][0]).toString() + "," + (emg_binary_activation_vector[index][0]).toString() + "," + (emg_activity_vector[index][1]).toString() + "," + (emg_binary_activation_vector[index][1]).toString() +  "," + (emg_activity_vector[index][2]).toString()  + "," + (emg_binary_activation_vector[index][2]).toString()+  "," + (emg_activity_vector[index][3]).toString()  + "," + (emg_binary_activation_vector[index][3]).toString() +  "," + (emg_activity_vector[index][4]).toString()  + "," + (emg_binary_activation_vector[index][4]).toString() +  "," + (emg_activity_vector[index][5]).toString()  + "," + (emg_binary_activation_vector[index][5]).toString() +  "," + (emg_activity_vector[index][6]).toString()  + "," + (emg_binary_activation_vector[index][6]).toString()+  "," + (emg_activity_vector[index][7]).toString()  + "," + (emg_binary_activation_vector[index][7]).toString() + 
										//tibiaL_accX_vector[index].toString() + "," + tibiaR_accX_vector[index].toString() +  ");"
										    acc_rom_hip_vector[index][1].toString() + "," + acc_rom_hip_vector[index][0].toString() + ");"
						//var sql = "INSERT INTO data_sessions (idSesion, Date, emg_muscle_activity_s1,  muscle_binary_activation_s1, emg_muscle_activity_s2,  muscle_binary_activation_s2, emg_muscle_activity_s3,  muscle_binary_activation_s3,  emg_muscle_activity_s4,  muscle_binary_activation_s4,  emg_muscle_activity_s5,  muscle_binary_activation_s5, emg_muscle_activity_s6,  muscle_binary_activation_s6, emg_muscle_activity_s7,  muscle_binary_activation_s7, emg_muscle_activity_s8, muscle_binary_activation_s8, accX_s7, accY_s7, accZ_s7, accX_s3, accY_s3, accZ_s3) VALUES " + insertDataRows;
						var sql = "INSERT INTO data_sessions (idSesion, Date, accX_s7,accX_s3) VALUES " + insertDataRows;
						
						
					} else if (is_swalker_connected){
						
						// swalker connected. No emg .

							insertDataRows = "(" + (sessionID).toString() + "," + (time_stamp_vector[index]).toString() +","+ 
											(rom_left_vector[index]).toString() + "," + (rom_right_vector[index]).toString()  + "," + (load_vector[index]).toString() + "," + (dir_vector).toString()  + ");"
							var sql = "INSERT INTO data_sessions (idSesion, Date, left_hip, right_hip, weight_gauge, direction) VALUES " + insertDataRows;
						
						
					
					}
					//console.log(sql);
					con.query(sql, function (err, result) {
						
						if (err) throw err;
					});
				}
				console.log("Recorded Session Data");
				// Emisión de un mensaje que indica que lo datos han sido grabados correctamente. El objetivo de este mensaje es que no se empiece una nueva terapia sin haber grabado la anterior.
				// Por lo tanto, hasta que no se recibe este mensaje en therapy_moitring, al pulsar en "nueva terapia" salta un aviso informando de que no es posible empezar una nueva terapia porque todavía se están almacenando los datos anteiores.
				socket.emit("monitoring:recorded_sessionData");
			});
		    });
		});
           });

        })
	
	
	//Creación de un archivo excel con todos los datos de acelerómetro de los sensores del delsys
	if(is_delsys_connected){
	    // Creación de un archivo con 3 hojas, cada una de las cuales alojará a información de uno de los ejes de los 8 sensores.
	    const workbook = new ExcelJS.Workbook();
	    const worksheetx = workbook.addWorksheet('X Axis');
	    const worksheety = workbook.addWorksheet('Y Axis');
	    const worksheetz = workbook.addWorksheet('Z Axis');
	
	    worksheetx.addRow(["RF D X", "BF D X" ,"TA D X", "GM D X", "RF I X", "BF I X", "TA I X", "GM I X"])
	    worksheety.addRow(["RF D Y", "BF D Y" ,"TA D Y", "GM D Y", "RF I Y", "BF I Y", "TA I Y", "GM I Y"])
	    worksheetz.addRow(["RF D Z", "BF D Z" ,"TA D Z", "GM D Z", "RF I Z", "BF I Z", "TA I Z", "GM I Z"])
		    
	    for (var i = 0; i < acc_all_data.length; i++) {
		worksheetx.addRow([acc_all_data[i][0], acc_all_data[i][3] , acc_all_data[i][6], acc_all_data[i][9], acc_all_data[i][12], acc_all_data[i][15], acc_all_data[i][18], acc_all_data[i][21]]).commit()
		worksheety.addRow([acc_all_data[i][1], acc_all_data[i][4] ,acc_all_data[i][7], acc_all_data[i][10], acc_all_data[i][13], acc_all_data[i][16], acc_all_data[i][19], acc_all_data[i][22]]).commit()
		worksheetz.addRow([acc_all_data[i][2], acc_all_data[i][5] ,acc_all_data[i][8], acc_all_data[i][11], acc_all_data[i][14], acc_all_data[i][17], acc_all_data[i][20], acc_all_data[i][23]]).commit()
		    
		    
	    }	
	    workbook.xlsx.writeFile('all_acc_datax.xlsx');
	    
	    // Para asegurar que se ha almacenado el excel correcamente, la descarga comenzará en 5 segundos.
	    n = 1;
	    const limitedInterval = setInterval(() => {
		if (n == 4){
			socket.emit("monitoring:downloadAccExcellx");
			console.log("sent")
		
		}
		if(n == 5){

			clearInterval(limitedInterval);	
		}	 
		n++
		    
	    }, 1000)
	}
	
	//Creación de un archivo excel con los datos del sensor EMG Werium (emg1 y emg2)
	if(is_ble_connected){
	    // Creación de un archivo con 3 hojas, cada una de las cuales alojará a información de uno de los ejes de los 8 sensores.
	    const workbook = new ExcelJS.Workbook();
	    const worksheet = workbook.addWorksheet('EMG');

	
	    worksheet.addRow(["CHANNEL 1", "CHANNEL 2"])
	   	    
	    for (var i = 0; i < emg1_vector.length; i++) {
		worksheet.addRow([emg1_vector[i], emg2_vector[i]]).commit()
		   
	    }	
	    workbook.xlsx.writeFile('EMG_Werium.xlsx');
	    
	    // Para asegurar que se ha almacenado el excel correcamente, la descarga comenzará en 5 segundos.
	    n = 1;
	    const limitedInterval = setInterval(() => {
		if (n == 4){
			socket.emit("monitoring:downloadEMGWerium");
		
		}
		if(n == 5){

			clearInterval(limitedInterval);	
		}	 
		n++
		    
	    }, 1000)
	}
	
    });

    //DELETE SESSION FROM DATABASE (users.js)
    socket.on('deleted_session', function(iddeleted) {
        var sql_sessions = "DELETE FROM tabla_sesion WHERE idtable_session="+iddeleted;
        var sql_data = "DELETE FROM data_sessions WHERE idSesion="+iddeleted;
        con.query(sql_sessions, function (err, result) {
            console.log("Delet Session");
        });
        con.query(sql_data, function (err, result) {
            console.log("Delet Data Session");
        });
    });

    //DOWNLOAD SESSIONS CONFIGURATION (DATABASE) (users.js)
    socket.on('download_sessions_config',function(res){
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Session');
        worksheet.columns = [
            { header: 'Id Session', key: 'idtable_session', width: 20 },
            { header: 'Date', key: 'Date', width: 10 },
            { header: 'Id Patient', key: 'idPaciente', width: 20 },
            { header: 'Number of session', key: 'NumberSession', width: 30 },
            { header: 'Id Therapist', key: 'idTerapeuta', width: 20 },
            { header: 'Gait Velocity', key: 'gait_velocity', width: 20 },
            { header: 'Observations', key: 'observations', width: 100 },
        ];
        var sql = "SELECT * FROM tabla_sesion";
        con.query(sql, function (err, sessions_data) {
            if (err) throw err;
                for (var i = 0; i < sessions_data.length; i++) {
                    worksheet.addRow((sessions_data[i]));
                }
            workbook.xlsx.writeFile('Sessions_Configurations_data.xlsx');
        });
    })

    //DOWNLOAD SESSION DATA (DATABASE) (users.js)
    socket.on('download_sessions_data',function(idsesion){
        console.log("Download Data")
        idsesion = idsesion;
        console.log(idsesion)
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Session');
        worksheet.columns = [
            { header: 'Id Data', key: 'iddata_sessions', width: 10 },
            { header: 'Id Sesion', key: 'idSesion', width: 10 },
            { header: 'Time (ms)', key: 'Date', width: 10 },
            { header: 'Left Hip Real', key: 'left_hip', width: 10 },
            { header: 'Right Hip Real', key: 'right_hip', width: 10 },
            { header: 'Weigth Gauge', key: 'weight_gauge', width: 20 },
            { header: 'Direction', key: 'direction', width: 20 },
            { header: 'Left hip ROM (acc)', key: 'accX_s7', width: 30 },
            { header: 'Right hip ROM (acc)', key: 'accX_s3', width: 30 },
           

        ];
        var sql = "SELECT * FROM data_sessions WHERE idSesion=" + idsesion.toString() + ";";
        console.log(sql);
        con.query(sql, function (err, sessions_data) {
            if (err) throw err;
                for (var i = 0; i < sessions_data.length; i++) {
                    worksheet.addRow((sessions_data[i]));
                }
            data_session_id = idsesion.toString();
            workbook.xlsx.writeFile("Session_" + data_session_id + ".xlsx");
            socket.emit('open_download_sessions_link');
        });
    })
    
    //DOWNLOAD SESSION DATA (DATABASE)    (users.js)
    socket.on('download_all_sessions_data',function(){
        console.log("Download all sessions Data")
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DataSessions');
        worksheet.columns = [
            { header: 'Id Data', key: 'iddata_sessions', width: 10 },
            { header: 'Id Sesion', key: 'idSesion', width: 10 },
            { header: 'Time (ms)', key: 'Date', width: 10 },
            { header: 'Left Hip Real', key: 'left_hip', width: 10 },
            { header: 'Right Hip Real', key: 'right_hip', width: 10 },
            { header: 'Weigth Gauge', key: 'weight_gauge', width: 20 },
            { header: 'Direction', key: 'direction', width: 20 },
            { header: 'Left Hip ROM (acc)', key: 'accX_s7', width: 30 },
            { header: 'RighHip ROM (acc)', key: 'accX_s3', width: 30 },
        ];
        var sql = "SELECT * FROM data_sessions;";
        console.log(sql);
        con.query(sql, function (err, sessions_data) {
            if (err) throw err;
                for (var i = 0; i < sessions_data.length; i++) {
                    worksheet.addRow((sessions_data[i]));
                }
            workbook.xlsx.writeFile("All_DataSessions.xlsx");
            socket.emit('open_download_all_sessions_link');
        });
    })

    //LOAD SW SESSION DATA (ROM & GALGA). WEBSOCKET SOLICITANDO INFORMACIÓN PARA EL RESUMEN DE LA SESIÓN.   (USERS.JS)
    socket.on('load_session_data',function( idsesion){

	// store the ROM LEFT values for the summary
	let load_session_rom_left = [];
	let load_session_rom_left_objects = [];
        var sql = "SELECT left_hip FROM data_sessions WHERE idSesion=" + idsesion.toString() + ";";
        con.query(sql, function (err, rom_left_data) {
            if (err) throw err;
            load_session_rom_left_objects = rom_left_data;
            for( var i = 0; i < load_session_rom_left_objects.length; i++ )  {
                load_session_rom_left.push(load_session_rom_left_objects[i].left_hip)
            }
            
        });
	
	// store the ROM RIGHT values for the summary
	let load_session_rom_right = [];   
	let load_session_rom_right_objects = [];
        var sql = "SELECT right_hip FROM data_sessions WHERE idSesion=" + idsesion.toString() + ";";
        con.query(sql, function (err, rom_right_data) {
            if (err) throw err;
            load_session_rom_right_objects = rom_right_data;
            for( var i = 0; i < load_session_rom_right_objects.length; i++ )  {
                load_session_rom_right.push(load_session_rom_right_objects[i].right_hip)
            }            
        });
	
	// store the weight supported values for the summary
        let load_session_weight_gauge = [];
	let load_session_weight_gauge_objects = [];
        var sql = "SELECT weight_gauge FROM data_sessions WHERE idSesion=" + idsesion.toString() + ";";
        con.query(sql, function (err, rom_right_data) {
            if (err) throw err;
            load_session_weight_gauge_objects = rom_right_data;
            for( var i = 0; i < load_session_rom_right_objects.length; i++ )  {
                load_session_weight_gauge.push(load_session_weight_gauge_objects[i].weight_gauge)
            }            
        });
        
        socket.emit('session_data_loaded', {
            rom_l: load_session_rom_left,
            rom_r: load_session_rom_right,
            load: load_session_weight_gauge
        })
        
        load_session_rom_right = []
        load_session_rom_left = []
        load_session_weight_gauge = []
    })

    // Alojamiento de los archivos Excel creados durante el uso de la interfaz en una url. Estos archivos se mantienen actualizados gracias a un setInterval que realiza el alojamiento cada segundo.
    app.get('/downloadsessionsconfig', (req, res) => setTimeout(function(){ res.download('./Sessions_Configurations_data.xlsx'); }, 1000))
    app.get('/downloadsessionsdata', (req, res) => setTimeout(function(){ res.download('./Session_' + data_session_id + '.xlsx'); }, 1000))
    app.get('/downloadallsessionsdata', (req, res) => setTimeout(function(){ res.download('./All_DataSessions.xlsx'); }, 1000))
    app.get('/downloadtherapists', (req, res) => setTimeout(function(){ res.download('./Therapists_data.xlsx'); }, 1000))
    app.get('/downloadpatients', (req, res) => setTimeout(function(){ res.download('./Patients_DB.xlsx'); }, 1000))

    app.get('/downloadaccdata1', (req, res) => setTimeout(function(){ res.download('./all_acc_datax.xlsx'); }, 1000))
    app.get('/downloadaccEMGWerium', (req, res) => setTimeout(function(){ res.download('./EMG_Werium.xlsx'); }, 1000))

    //GET PATIENT INFO AND AUTOFILL IN "Therapy Settings" (DATABASE)    (therapy_settings.js)
    socket.on('get_patient_info',function(data){
        // Get patient ID from database
        var name = data.patient_name.split(" ")[0];
        var surname =  data.patient_name.split(" ")[(data.patient_name.split(" ").length -1 )];
        var patient_id = "";
	// Peticion SQL para obtener los datos almacenados en la tabla de pacientes de un paciente en concreto.
        var sql_patient = "SELECT * FROM tabla_pacientes WHERE NombrePaciente='" + name.toString() + "' AND ApellidoPaciente='" + surname.toString() + "';";
        console.log(sql_patient);
        con.query(sql_patient, function (err, patient_data) {
            if (err) throw err;
            console.log(patient_data);
            patient_id = patient_data[0].idtabla_pacientes; 
            console.log(patient_data[0].idtabla_pacientes);
            if (patient_id =! undefined) {
                patient_id = patient_data[0].idtabla_pacientes;

		patient_age = patient_data[0].patiente_age; test_rom_right_vector
		patient_weight = patient_data[0].patiente_weight;
		global_patient_weight = parseFloat(patient_data[0].patiente_weight);
		patient_leg_length = patient_data[0].leg_length;
		patient_hip_joint = patient_data[0].hip_joint;
		var surgery = patient_data[0].surgery;
		var estado_fisico = patient_data[0].estado_fisico;
		var estado_cognitivo = patient_data[0].estado_cognitivo;
		console.log("patient_age: " + patient_age.toString() + " patient_weight: " + patient_weight.toString());
		// emisión de un mensaje por websocket a therapy_settings.js con la información solicitada.
		socket.emit('set_patient_info', {
			patient_age: patient_age,
			patient_weight: patient_weight,
			patient_leg_length: patient_leg_length,
			patient_hip_joint: patient_hip_joint,
			patient_surgery: surgery,
			estado_fisico: estado_fisico,
			estado_cognitivo: estado_cognitivo,
			
		})

	    }

        });
    })
    
    // Cambio de la velocidad del swalker desde therapy monitoring
    socket.on('monitoring:updateTherapySpeed', (data) => {
        var therapyConfigPath = path.join(__dirname, 'config','therapySettings.json');
	therapy_speed = data.speed
	
	fs.readFile(therapyConfigPath, (err, data) => {
		if (err) throw err;
		let json_obj = JSON.parse(data);
		console.log(json_obj)
		json_obj["gait_velocity"] = therapy_speed;
		console.log(json_obj)
		fs.writeFileSync(therapyConfigPath, JSON.stringify(json_obj), function (err){
			if (err) throw err;
			console.log('Therapy settings re-saved!')
		})
	});
	console.log(therapy_speed)
    })	

	
    // SOLICITUD DEL MOVIMIENTO DEL SWALKER. ENVÍO DE COMANDOS AL ANDADOR (BT)  (therapy_monitoring.js)
    socket.on('traction:message', (data) => {
	// data = {direction_char: .. }
	//Get command value
	direction_char  = data.direction_char;
	if (therapy_speed == "high"){
	    therapy_speed = 'f';
	} else if (therapy_speed == 'f'){
	    therapy_speed = 'f';
	} else if (therapy_speed == 'slow'){
	    therapy_speed = 's';
	} else if (therapy_speed == 's'){
	    therapy_speed = 's';
	} else{
	    therapy_speed = 'n';
	}

	var cmd = ''  //Command var to send
	
	if (direction_char == 'b' | direction_char == 'f'){
		cmd = '#'+ direction_char + therapy_speed;
	} else {
		cmd = '#'+ direction_char;
	}

	//send command cmd to swalker
	console.log(cmd)
	var buf = Buffer.from(cmd, 'utf8');
	serial_swalker.write(buf)
	    .then(() => console.log('Data successfully written'))
	    .catch((err) => console.log('Error while sending command to SWALKERII', err))
    })

    // MENSAJE PRINCIPAL DE ENVIO DE DATOS A THERAPY_MONITORING PARA SU REPRESENTACION EN TIEMPO REAL. (THERAPY_MONITORING.JS)
    setInterval(function () {
        socket.emit('monitoring:jointData', {
            // SWALKER
            swalker_connection_status: is_swalker_connected,
            load: (parseFloat(load)/global_patient_weight)*100,
            rom_right: (rom_right - parseFloat(rom_right_calibration)),
            rom_left: (rom_left - parseFloat(rom_left_calibration)),
            // EMG
            emg: emg_msg,
            emg_connection_status: is_delsys_connected,
        })
        
	// Aumentamos el tiempo trascurrido desde el último mensaje. Si este tiempo supera los 15 segundos, asumimos que se ha desconectado el dispositivo en cuestión y cerramos el socket. 
	// La variable que aloja los milisegundos trascurridos se reinicia a 0 cada vez que se recibe un nuevo mensaje. 
        if(is_swalker_connected){
		msecondsFromLastMessage_swalker += PLOTSAMPLINGTIME;
		if (msecondsFromLastMessage_swalker > 15000){
			disconnect_bt_device(socket, serial_swalker, is_swalker_connected, "sw");
			msecondsFromLastMessage_swalker = 0;
		}
	}
		
	 if(is_delsys_connected){
		msecondsFromLastMessage_delsys += PLOTSAMPLINGTIME;
		if (msecondsFromLastMessage_delsys > 20000){
		    msecondsFromLastMessage_delsys = 0;
		     socket.emit('monitoring:connection_status', {
			device: "emg",
			// status--> 0: connect, 1: disconnect, 2: not paired, 3: conn error, 4: conn closed
			status: 3
		    }) 
		    is_delsys_connected = false;
		}
	}

    }, PLOTSAMPLINGTIME);

    // Save therapy settings in a JSON file. (THERAPY_SETTINGS.JS)
    socket.on('settings:save_settings', (data) => {
		console.log("save_Settings");
        fs.writeFileSync(therapyConfigPath, JSON.stringify(data), function (err){
            if (err) throw err;
            console.log('Therapy settings saved!')
        })
    })
    
    // Update json therapy settings in session observations.(THERAPY_MONITORING.JS)
    // SE AÑADE LA VARIABLE OBSERVACIONES, ADQUIRIDA EN THERAOY_MONITORING, A LOS DATOS ALMACENADOS EN json EN THERAPYSETTINGS.
    socket.on('monitoring:save_settings', (obs) => {
	console.log("update save_settings");
        var therapyConfigPath = path.join(__dirname, 'config','therapySettings.json');

		fs.readFile(therapyConfigPath, (err, data) => {
			if (err) throw err;
			let json_obj = JSON.parse(data);
			console.log(json_obj)
			json_obj["observations"] = obs;
			console.log(json_obj)
			fs.writeFileSync(therapyConfigPath, JSON.stringify(json_obj), function (err){
				if (err) throw err;
				console.log('Therapy settings re-saved!')
			})
		});
    })	

    // Show therapy settings in the monitoring screen.
    socket.on('monitoring:ask_therapy_settings', function(callbackFn) {
        // Read therappy settings from config file.
        fs.readFile(therapyConfigPath, (err, data) => {
            if (err) throw err;
            let config = JSON.parse(data);
            console.log(config);
            console.log(config.gait_velocity)
            therapy_speed = config.gait_velocity;
			patient_leg_length = config.leg_length;
			global_patient_weight = config.patient_weight;
			console.log(global_patient_weight);
            // Send values
            socket.emit('monitoring:show_therapy_settings', {
                patient_name : config.patient_name,
                patient_age : config.patient_age,
                patient_weight :  config.patient_weight,
                gait_velocity :   config.gait_velocity,
                pbws :   config.pbws,
                leg_length: config.leg_length
            })
        });
    });

    // SOLICITUD DE CALIBRACIÓN (THERAPY_MONITORING.JS).
    socket.on('monitoring:configure_robot', function(callbackFn) {
        console.log("monitoring:configure_robot");
        configureStartPos();
    });

    // sOLICITUD DE CONEXIÓN BLUETOOTH CON EL ANDADOR ( THERAPY_MONITORING.JS)
    socket.on('monitoring:connect_swalker', function(callbackFn) {
	console.log(is_swalker_connected);
        connect_bt_device(socket, serial_swalker, is_swalker_connected, "sw");

    });
    // SOLICITUD DE DESCONEXIÓN DEL SWALKER (THERAPY_MONITORING.JS)
    socket.on('monitoring:disconnect_swalker', function(callbackFn) {
        // Reset all vectors VARIABLES
        load_vector = []
        rom_right_vector = []
        rom_left_vector = []
        
        rom_left = 0;
        rom_right = 0;
        load = 0;
        rom_right_calibration = 0;
        rom_left_calibration = 0;

        disconnect_bt_device(socket, serial_swalker, is_swalker_connected, "sw");

    });
    
   
    // SOLICITUD DE CONEXIÓN DEL SOFTWARE EMGdataAcquisition.py  (THRAPY_MONITORING.JS)
    socket.on('monitoring:connect_emg', function(callbackFn) {
	// CLIENT_DELSYS_START: SOCKET DE COMANDOS
	// CLIENT_DELSYS_DATA: SOCKET DE DATOS DE EMG
        console.log("mensaje conexion emg")
	console.log(is_delsys_connected)
	    if (!is_delsys_connected) {
			
		// CONNECT start port
	        client_delsys_start.connect(DELSYS_START_PORT, DELSYS_PC_IP, function() {
	            console.log('Connected to start');
	        });  
	    // mENSAJE AUTOMATICO DESENCADENADO POR UN ERROR EN EL SOCKET
            client_delsys_start.on('error', function(ex) {
                console.log(ex);
                socket.emit('monitoring:connection_status', {
                    device: "emg",
                    // status--> 0: connect, 1: disconnect, 2: not paired, 3: conn error, 4: conn closed
                    status: 3
                }) 
            });  
	    // MENSAJE AUTOMATICO DESENCADENADO POR EL FIN DEL SOCKET
            client_delsys_start.on('end', function() {
                console.log('Delsys start ended');
		socket.emit('monitoring:connection_status', {
                    device: "emg",
                    // status--> 0: connect, 1: disconnect, 2: not paired, 3: conn error, 4: conn closed
                    status: 1
                }) 
            });
	    // mENSAJE AUTOMATICO DESENCADENADO POR EL CIERRE DESDE EL OTRO EXTREMO DEL SOCKET
            client_delsys_start.on('close', function() {
                console.log('Delsys start closed');
                socket.emit('monitoring:connection_status', {
                    device: "emg",
                    // status--> 0: connect, 1: disconnect, 2: not paired, 3: conn error, 4: conn closed
                    status: 4
                }) 
            });   
	            
	        // CONNECT EMG data port
	        client_delsys_data.connect(DELSYS_DATA_PORT, DELSYS_PC_IP, function() {
                console.log('Connected to data');
		// ENVÍO DEL COMANDO QUE INICIA EL STREAING DE LOS DATOS
                client_delsys_start.write('#startStream');
                is_delsys_connected = true;

                socket.emit('monitoring:connection_status', {
                    device: "emg",
                    // status--> 0: connect, 1: disconnect, 2: not paired, 3: conn error, 4: conn closed
                    status: 0
                }) 

            }); 
	    // mENSAJE AUTOMATICO DESENCADENADO POR UN ERROR EN EL SOCKET
            client_delsys_data.on('error', function(ex) {
                console.log(ex);
                connect_delsys = false;
		socket.emit('monitoring:connection_status', {
                    device: "emg",
                    // status--> 0: connect, 1: disconnect, 2: not paired, 3: conn error, 4: conn closed
                    status: 3
                }) 
            });
	    // MENSAJE AUTOMATICO DESENCADENADO POR EL FIN DEL SOCKET
            client_delsys_data.on('end', function() {
                console.log('Delsys data ended');
		socket.emit('monitoring:connection_status', {
                    device: "emg",
                    // status--> 0: connect, 1: disconnect, 2: not paired, 3: conn error, 4: conn closed
                    status: 2
                }) 
            });
	    // mENSAJE AUTOMATICO DESENCADENADO POR EL CIERRE DESDE EL OTRO EXTREMO DEL SOCKET
            client_delsys_data.on('close', function() {
                console.log('Delsys data closed');
		socket.emit('monitoring:connection_status', {
                    device: "emg",
                    // status--> 0: connect, 1: disconnect, 2: not paired, 3: conn error, 4: conn closed
                    status: 4
                }) 
            });
            
            // CONNECT AUX Acc data port (COEXIÓN A SOCKET ABIERTO EN TCU)
            client_delsys_acc.connect(delsys_acc_port, DELSYS_PC_IP, function() {
                console.log('Connected to acc');

            }); 
	    // mENSAJE AUTOMATICO DESENCADENADO POR UN ERROR EN EL SOCKET
            client_delsys_acc.on('error', function(ex) {
                console.log(ex);
                connect_delsys = false;
            });
	    // MENSAJE AUTOMATICO DESENCADENADO POR EL FIN DEL SOCKET
            client_delsys_acc.on('end', function() {
                console.log('Delsys acc ended');
            });
	    // mENSAJE AUTOMATICO DESENCADENADO POR EL CIERRE DESDE EL OTRO EXTREMO DEL SOCKET
            client_delsys_acc.on('close', function() {
                console.log('Delsys acc closed');
            });
	    }
    });
    // Disconnect EMG    (THERAPY_MONITORING.JS)
    socket.on('monitoring:disconnect_emg', function(callbackFn) {
    	if(is_delsys_connected) {
            console.log("----------------STOP_RECORD--------------------");
            client_delsys_start.write('#stopStream');
        }
		client_delsys_start.destroy();
		client_delsys_data.destroy();
		client_delsys_acc.destroy();
		is_delsys_connected = false;
        socket.emit('monitoring:connection_status', {
            device: "emg",
            // status--> 0: connect, 1: disconnect, 2: not paired, 3: conn error, 4: conn closed
            status: 1
        }) 
    });

    // Flag to emg acquisition program to save the raw data    (THERAPY_MONITORING.JS)
    socket.on('monitoring:save_emg', function(callbackFn) {
    	if(is_delsys_connected) {
            console.log("----------------Save data--------------------");
            client_delsys_start.write('#record');
        }
    });
    
    // CONEXIÓN CON DISPOSITIVO BLE Y SUBSCRIPCIÓN A CARACTERÍSTICA (THERAPY_MONITORING.JS)
    socket.on('monitoring:connect_ble', function(callbackFn) {
	if(!is_ble_connected){
	    console.log("not connected");
	    device_object, characteristic_object = getDeviceAndCharObjects(socket, ble_macAddr, ble_service, ble_characteristic)
	    if (characteristic_object != null){
		subscribeToChar(characteristic_object)
	    }
	} else {
	    socket.emit('monitoring:connection_status',{
               device: "ble",
               status:0});
	}
    });
    
    // DESCONEXION DEL SOCKET DE VR  (THERAPY_MONITORING.JS)
    socket.on('monitoring:disconnect_ble', function(callbackFn) {
        if(is_ble_connected){
	    device_object.disconnect()
	    .then(function(){
		destroy();
	    })
	    .catch(function(err){
		console.log("No ha sido posible desconectar el dispositivo BLE" + err)
	    })
	}
    });

    // CONEXION DEL SOCKET DE VR  (THERAPY_MONITORING.JS)
    socket.on('monitoring:connect_vr', function(callbackFn) {
        // The UDP network is used to communicate with oculus quest.
        // The predicted stride length will be send through this socket to feed the VR environment.
        // UPD sockets to send data
        
        if (is_client_connected){
           socket.emit('monitoring:connection_status',{
               device: "vr",
               status:0});
           vr_ready = true;
           
        }else{
           socket.emit('monitoring:connection_status',{
             device: "vr",
             status:1})
            }
    });
    
    // DESCONEXION DEL SOCKET DE VR  (THERAPY_MONITORING.JS)
    socket.on('monitoring:disable_vr', function(callbackFn) {
        //tcpServer_VR_.close();
        vr_ready = false;
        socket.emit('monitoring:connection_status', {
            device: "vr",
            // status--> 0: connect, 1: disconnect, 2: not paired, 3: conn error, 4: conn closed
            status: 1
        }) 
    });
    
    // SE HA PULSADO EL BOTÓN JUEGO 1 EN THERAPY MONITORING
    socket.on('monitoring:juego1', function(callbackFn){
	socket['VR_socket'].write('#o1');
    })
    
    // SE HA PULSADO EL BOTÓN JUEGO 2 EN THERAPY MONITORING
    socket.on('monitoring:juego2', function(callbackFn){
	socket['VR_socket'].write('#o2');
    })
    
    // iNDICA EL INICIO DE LA SESIÓN (THERAPY_MONITORING.JS) eNVIADO AL PULSAR EL BOTÓN START.-
    socket.on('monitoring:start', function(callbackFn) {

        // Reset all vectors
        time_stamp_vector = [];
        // SWALKER
        load_vector = [];
        rom_right_vector = [];
        rom_left_vector = [];
        load = 0;
        rom_right = 0;
        rom_left = 0;
        acc_rom_hip_vector = [];
        rom_hip_l_cal = rom_hip_l;
	rom_hip_r_cal = rom_hip_r;

        // Start recording
        record_therapy = true;
	
	// BLE
	if(is_ble_connected & (characteristic_object != null)){
	    emg1_vector = [];
	    emg2_vector = [];
	    // change data streaming to channel 3 -> emg1,emg2
	    characteristic_object.writeValue(Buffer.from("o3"))
	    // Send command to start streaming
	    characteristic_object.writeValue(Buffer.from("os"))
	}
        console.log("is connected")
        console.log(is_delsys_connected)

        if(is_delsys_connected) {
            console.log("----------------RECORD--------------------");
            client_delsys_start.write('#start');
        }
    });

    // iNDICA EL fin DE LA SESIÓN (THERAPY_MONITORING.JS) eNVIADO AL PULSAR EL BOTÓN STOP.-    
    socket.on('monitoring:stop', function(callbackFn) {

    	if(is_delsys_connected) {
            console.log("----------------STOP_RECORD--------------------");
            client_delsys_start.write('#stop');
        }
		if(is_swalker_connected){
			stopTherapy();
		}
        record_therapy = false;

        console.log("Duration of the therapy:" + ((time_stamp_vector[time_stamp_vector.length - 1] - time_stamp_vector[0]) / 1000.00 / 60.00).toString());
		is_calibrated = false;
    });
});

// Configure swalker to start the therapy. Set ROM calibration in stance position.
function configureStartPos() {
    console.log("ROM calibration");
    is_calibrated = true;
    console.log(is_calibrated);
    rom_left_calibration = rom_left;
    rom_right_calibration = rom_right;
    
    if(is_delsys_connected){
	rom_hip_l_cal = rom_hip_l;
	rom_hip_r_cal = rom_hip_r;
    }

}

// Stop therapy.
function stopTherapy() {
    console.log("Stop Therapy");
    
    // send command stop to swalker
    stopSwalker();

    rom_left_calibration = 0;
    rom_right_calibration = 0;
    rom_hip_l_cal = 0;
    rom_hip_r_cal = 0;
}

function stopSwalker(){
    //send command cmd to swalker
    var buf = Buffer.from("#s", 'utf8');
    serial_swalker.write(buf)
    .then(() => console.log('Data successfully written'))
    .catch((err) => console.log('Error', err))
}

// Funcion de conversión de un mensaje a string y parseo de mensajes individuales. Devuelve: booleano que indica si ya se ha recibido el primer mensaje; lista con los mensajes que se han parseado.
function hex2a_general(hexx, lasthex, is_first_data) {
    var hex = hexx.toString();//force conversion
    var message = [];
    var newhex = "";
    
    if(is_first_data){
		is_first_data = false;
		lasthex = "";
		var splitted = [];
			
	} else {
		for (var i = 0; i < hex.length; i++){
			if (!(hex[i] == "\r" || hex[i] == "\n")){
				newhex += hex[i];
			}
		}
		
		newhex = lasthex + newhex;
		if (newhex.includes("#")){
			var splitted = newhex.split("#");
		} else {
			var splitted = []
		}
	
	}
	message.push(splitted)
	message.push(is_first_data)
	
    return message; 
}

// Función de conexión bluetooth de un dispositivo
// argumentos: socket (websocket) por el que se emite el mensaje de stado de la conexión, variable donde se ha creado el objeto bt, booleano que indica el estado de conexión actual con el dispositivo, string que identifica el dispositivo.
function connect_bt_device(socket, bt_object, status_boolean, str_device){
		
	if (!status_boolean){
		status_boolean = false;
		var deviceNotFound = true;
		var pairedDevices = bt_object.scan()
		.then(function(devices) {
			console.log("[Bt] Scanning devices ...");
			console.log(devices)
			
			// Check if the device is switch on and close to the raspberry
			for (let i = 0; i < devices.length; i++) {
				
				if(deviceNotFound){
					var device_name = devices[i].name;
					var device_address = devices[i].address;
							
					// case SWalker
					if ( str_device == 'sw'){
						if (devices[i].name == swBluetoothName | devices[i].name == "00:06:66:F2:4C:EE"){
							console.log("[Bt] Device found. Trying connection...")
							deviceNotFound = false;
						}
					// case sensors ProMotion 
					}
					
					// Device found
					if(!deviceNotFound){
						bt_object.connect(device_address)
						.then(function() {
							console.log('[Bt] Bluetooth connection established with device name: ' + device_name)
							socket.emit('monitoring:connection_status', {
								device: str_device,
								// status--> 0: connect, 1: disconnect, 2: not paired
								status: 0
							}) 
							if(str_device == "sw"){
								is_swalker_connected = true;
							}
							
						})
						.catch(function(err) {
							// The device has not been found.
							var deviceNotFound = false;
							console.log('[Error] Device: ' + device_name , err);
							
							// message status in case WALKERII interface
							socket.emit('monitoring:connection_status', {
								device: str_device,
								// status--> 0: connect, 1: disconnect, 2: not paired
								status: 1
							}) 
						})
					}
				}
			}
			
			// Device not found
			if(deviceNotFound){
				console.log("device not found!");
				// message status in case SWALKERII interface
				socket.emit('monitoring:connection_status', {
					device: str_device,
					// status--> 0: connect, 1: disconnect, 2: not paired/not found
					status: 2
				}) 
			
			} 
				
		})
		.catch(function(err){
			console.log("error in bluetooth connection")
		});
		
	
		
	}else{
		console.log('[Bt] The device is already connected!')
		socket.emit('monitoring:connection_status', {
			device: str_device,
			// status--> 0: connect, 1: disconnect, 2: not paired
			status: 0
		}) 
    }
	
}

// Función de desconexión bluetooth de un dispositivo
// argumentos: socket (websocket) por el que se emite el mensaje de stado de la conexión, variable donde se ha creado el objeto bt, booleano que indica el estado de conexión actual con el dispositivo, string que identifica el dispositivo.
function disconnect_bt_device(socket, bt_object, status_boolean, str_device){
    if (status_boolean){
		bt_object.close()
		.then(function() {
			console.log('[Bt] Bluetooth connection successfully closed ');
			status_boolean = false;
			
			sockets['websocket'].emit('monitoring:connection_status',{
				 device: "sw",
				 status:3
			})
		})
		.catch(function(err) {
			console.log('Connetion already close')
			
		})
	
		if(str_device == "sw"){
			is_swalker_connected = false;
		}			
	}
	
}

// función de decodificación de 4 bytes a float, almacenamiento de losacelerómetros y calculo del rom de cadera a partir de los mismos
function decodeFloat(buf1, last_index){
	let index_channel = last_index

	let posInBuf = 0;
	let len = Buffer.byteLength(buf1);
	
	while (posInBuf < (len/4)){
		var data = [buf1[posInBuf+3], buf1[posInBuf+2], buf1[posInBuf+1], buf1[posInBuf]];
		var buf = new ArrayBuffer(4);
		var view = new DataView(buf);
		//set bytes
		data.forEach(function(b,i){
			view.setUint8(i,b);
		});
		let float = view.getFloat32(0);
		
		posInBuf = posInBuf+4;
		
		//if(record_therapy){
			if (index_channel  == 1){   
			    s1_accX = float
			} else if (index_channel  == 2){   
			    s1_accY = float
			} else if (index_channel == 3){
			    s1_accZ = float
			    //console.log(s1_accX + "    -    " + s1_accY + "    -     " + s1_accZ)
			} else if (index_channel  == 4){   
			    s2_accX = float
			} else if (index_channel  == 5){   
			    s2_accY = float
			} else if (index_channel == 6){
			    s2_accZ = float
			} else if(index_channel  == 7){   //accx sensor 3
			    tibiaR_accX = float
			    s3_accX = float
			} else if (index_channel == 8){
			    s3_accY = float
			} else if (index_channel == 9){
			    s3_accZ = float
			} else if (index_channel  == 10){   
			    s4_accX = float
			} else if (index_channel  == 11){  
			    s4_accY = float
			} else if (index_channel == 12){
			    s4_accZ = float
			} else if (index_channel  == 13){   
			    s5_accX = float
			} else if (index_channel  == 14){  
			    s5_accY = float
			} else if (index_channel == 15){
			    s5_accZ = float
			} else if (index_channel  == 16){  
			    s6_accX = float
			} else if (index_channel  == 17){   
			    s6_accY = float
			} else if (index_channel == 18){
			    s6_accZ = float
			} else if (index_channel == 19){
			    tibiaL_accX = float			//accx sensor 7
			    s7_accX = float
			} else if (index_channel == 20){
			    s7_accY = float
			} else if (index_channel == 21){
			    s7_accZ = float
			}else if (index_channel  == 22){   
			    s8_accX = float
			} else if (index_channel  == 23){  
			    s8_accY = float
			} else if (index_channel  == 24){  
			    s8_accZ = float
			} else if(index_channel == 48){
			    index_channel = 0;
			}
		//}
		
		try{
			//ROM CADERA
			rom_hip_r = (180* (Math.atan(-s1_accZ/s1_accX)) / Math.PI) - rom_hip_r_cal;
			if(isNaN(rom_hip_r)){
				rom_hip_r = 0;
			}
			rom_hip_l = (180* (Math.atan(-s5_accZ/s5_accX)) / Math.PI) - rom_hip_l_cal;
			if(isNaN(rom_hip_l)){
				rom_hip_l = 0;
			}
			//ROM RODILLA
			let rom_knee_r = 180* (Math.atan(-s1_accZ / -s1_accX) + Math.atan(-s3_accZ / s3_accX)) / Math.PI
			let rom_knee_l = 180* (Math.atan(-s5_accZ / -s5_accX) + Math.atan(-s7_accZ / s7_accX)) / Math.PI
			
			
		}catch(e){
			console.log(e)
			console.log("error calculatims ROM")
		}
		
		index_channel ++
		
	}
	
	return last_index;
	
}


// Esta función escanea los dispositivos ble cercanos y comprueba que esté el solicitado. A continuiación, 
function getDeviceAndCharObjects(socket, ble_macAddr, ble_service, ble_characteristic){
	// redirigimos el objeto a null por si no se encuentra la caracteristica o no es posible su subscripción
	var characteristic_object_fn = null
	// Escaneo de dispositivos BLE cercanos
	bluetooth.defaultAdapter()
	.then(function(adapter){
	    adapter.isDiscovering()
	    .then(function(is_discovering){
		    if(!is_discovering){
			adapter.startDiscovery()
			.then(function() {
			    is_discovering = true;
			})
			.catch(function(err){
			    console.log("error trying discovering")
			})
		    }
		    console.log("discovery started...");
		    adapter.waitDevice(ble_macAddr)
		    .then(function(device) {
			    console.log("find device!");
			    device_object = device
			    device_object.connect()
			    .then(function(){
				    console.log("Successfully connected");
				    is_ble_connected = true

				    device_object.gatt()
				    .then(function(gattServer){
					    const gattServer_ble = gattServer
					    gattServer_ble.getPrimaryService(ble_service)
					    .then(function(service){
						    console.log("Service found!")
						    const ble_service = service
						    ble_service.getCharacteristic(ble_characteristic)
						    .then(function(char){
							    console.log("found characteristic!")
							    characteristic_object_fn = char
							    
						    })
						    .catch(function(err){
							    console.log("error at getCharacteristic(): " + err)
						    });
							    
					    })
					    .catch(function(err) {
						    console.log("error while getting service: " + err)
					    });
				    })
				    .catch(function(err){
					    console.log("error while getting gattServer: " + err)
				    });
			    })
			    .catch(function(err){
				    console.log("error while connecting device: " + err)
				    socket.emit('monitoring:connection_status', {
					    device: "ble",
					    // status--> 0: connect, 1: disconnect, 2: not found/error
					    status: 2
				    })
			    });
			    
		    })
		    .catch(function(err){
			    console.log("could not find device. " + err)
			    socket.emit('monitoring:connection_status', {
				    device: "ble",
				    // status--> 0: connect, 1: disconnect, 2: not found/error
				    status: 2
			    })
		    });
			    
	    })
	    .catch(function(err){
		    console.log("error while trying startDiscovery(): " + err)
		    socket.emit('bluetooth:connection_status', {
			    device: "ble",
			    // status--> 0: connect, 1: disconnect, 2: not found/error
			    status: 2
		    })
	    });
    
	})
	.catch(function(err) {
	    console.log("Failed to find adapter" + err)
	});
	
	return device_object, characteristic_object
	
}

index_channel_emg = 0
function subscribeToChar(char_obj){
    
    characteristic_object.startNotifications()
    .then(function(){
	// emisión del mensaje de estado de conexión a therapy_monitoring
	    console.log("successfully subscribe to characteristic!")
	    socket.emit('monitoring:connection_status', {
		    device: "ble",
		    // status--> 0: connect, 1: disconnect, 2: not paired
		    status: 0
	    })
	    
    })
    .catch(function(err){
	    console.log("error while subscribing to char: " + err)
    });
							    
    characteristic_object.on("valuechanged", buffer => {
	let posInBuf = 0;
	let len = Buffer.byteLength(buffer);
	
	while (posInBuf < (len/3)){
	    var data = [buffer[posInBuf+2], buffer[posInBuf+1], buffer[posInBuf]];
	    float = convert3BtoFloat(data)
	    emg_raw = calibrateEMG(float)
	    
	    index_channel_emg = storeEMG(emg_raw, index_channel_emg)
	    posInBuf = posInBuf+3;
	}
    })
}

function convert3BtoFloat(data){
    // create a buffer
    var buff = new ArrayBuffer(3)
    // create a data view of it
    var view = new DataView(buff);
    
    // set bytes
    data.forEach(function(b,i) {
	view.setUint8(i,b);
    })
    
    // Read the bits as a float; note that by doing this, we're implicitly converting it from a 32-bit float into javascripts naive 64-bit double.
    var float = view.getFloat32(0)
    return float 
}

function calibretaEMG(value){
    var vRef = 2420.0
    var ADC_max = Math.pow(2,23)-1;  // 2420mV
    var ADC_sensitivity = vRef/ADC_max;   //LSB
    var gain = 12.0
    
    var emg_raw = (value*ADC_sensitivity)/gain
    return emg_raw;
}


function storeEMG(value, channel){
    if(channel == 0){
	emg1 = value;
	console.log(emg1)
	if(record_therapy){
	    emg1_vector.push(emg1)
	}
    } else if(channel == 1){
	emg2 = value;
	if(record_therapy){
	    emg2_vector.push(emg2)
	}
    }
    channel ++
    return channel
}


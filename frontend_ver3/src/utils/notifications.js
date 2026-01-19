import * as Notifications from 'expo-notifications';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 알림 권한 요청
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

// 화재 감지 알림 전송 (산불 발생 시 자동 호출)
export const sendFireDetectionNotification = async (droneId, probability) => {
  const warningLevel = probability >= 90 ? '🚨 긴급' : probability >= 75 ? '⚠️ 위험' : '주의';
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 산불 감지 알림!',
      body: `[Drone #${droneId}] ${warningLevel} - 화재 감지! (확률 ${probability}%)`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { droneId, probability, type: 'fire_detection' },
    },
    trigger: null, // 즉시 표시
  });
};

// 테스트 알림 (3초 후)
export const scheduleTestNotification = async (droneId, probability) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 화재 감지!',
      body: `[Drone #${droneId}] 화재 감지! (확률 ${probability}%)`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: { seconds: 3 },
  });
};


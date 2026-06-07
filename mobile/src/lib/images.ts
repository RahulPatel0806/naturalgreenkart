import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

/** Launch the device photo library. Returns the picked local URI, or null. */
export async function pickImageFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow photo access to choose an image.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS);
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

/** Launch the camera to capture a photo. Returns the captured local URI, or null. */
export async function captureImageFromCamera(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow camera access to take a photo.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync(PICK_OPTIONS);
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

/**
 * Prompt the user to choose between camera and library, then return the local
 * image URI. Resolves null if the user cancels.
 */
export function chooseImageSource(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.alert('Add image', 'Choose a source', [
      { text: 'Take photo', onPress: () => captureImageFromCamera().then(resolve) },
      { text: 'Choose from library', onPress: () => pickImageFromLibrary().then(resolve) },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

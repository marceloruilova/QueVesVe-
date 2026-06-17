import { LogBox } from 'react-native';

// Spy before App loads so we capture the module-level LogBox.ignoreLogs call
const ignoreSpy = jest.spyOn(LogBox, 'ignoreLogs').mockImplementation(() => {});

jest.mock('../routes', () => ({
  __esModule: true,
  default: () => null,
}));

// Trigger App evaluation (calls LogBox.ignoreLogs at module level)
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('../../App');

describe('App — LogBox suppressions', () => {
  it('suprime el warning de expo-av deprecation', () => {
    expect(ignoreSpy).toHaveBeenCalledWith(
      expect.arrayContaining(['[expo-av]', 'Expo AV has been deprecated']),
    );
  });
});

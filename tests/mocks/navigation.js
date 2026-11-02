export const createNavigationMock = () => ({
  navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn(),
  reset: jest.fn(), setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
});

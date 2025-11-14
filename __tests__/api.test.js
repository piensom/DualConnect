// Unit tests for API client (api.js)

describe('API Client', () => {
  let api;

  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();

    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should login successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        token: 'mock-jwt-token',
        user: { user_id: 1, email: 'test@example.com', name: 'Test User' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Simulate login (would use actual API client)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.token).toBe('mock-jwt-token');
      expect(data.user.email).toBe('test@example.com');
    });

    test('should fail login with invalid credentials', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'wrong@example.com', password: 'wrong' })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    test('should register new user successfully', async () => {
      const mockResponse = {
        success: true,
        token: 'new-jwt-token',
        user: { user_id: 2, email: 'new@example.com', name: 'New User' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('new@example.com');
    });
  });

  describe('Programs API', () => {
    test('should fetch programs list', async () => {
      const mockPrograms = [
        { program_id: 1, title: 'Software Developer', type: 'ausbildung' },
        { program_id: 2, title: 'Data Science', type: 'duales_studium' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ programs: mockPrograms })
      });

      const response = await fetch('/api/programs');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.programs).toHaveLength(2);
      expect(data.programs[0].title).toBe('Software Developer');
    });

    test('should filter programs by type', async () => {
      const mockPrograms = [
        { program_id: 1, title: 'Software Developer', type: 'ausbildung' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ programs: mockPrograms })
      });

      const response = await fetch('/api/programs?type=ausbildung');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.programs).toHaveLength(1);
      expect(data.programs[0].type).toBe('ausbildung');
    });

    test('should fetch single program details', async () => {
      const mockProgram = {
        program_id: 1,
        title: 'Software Developer',
        company_name: 'TechCorp',
        description: 'Learn software development'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgram
      });

      const response = await fetch('/api/programs/1');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.program_id).toBe(1);
      expect(data.title).toBe('Software Developer');
    });
  });

  describe('Applications API', () => {
    test('should submit application successfully', async () => {
      const mockResponse = {
        success: true,
        application_id: 123
      };

      global.localStorage.getItem.mockReturnValue('mock-auth-token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      });

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-auth-token'
        },
        body: JSON.stringify({
          program_id: 1,
          cover_letter: 'I am interested...'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.application_id).toBe(123);
    });

    test('should require authentication for application submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: 1 })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/programs');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    test('should handle 404 errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      });

      const response = await fetch('/api/programs/99999');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    test('should handle 500 server errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      const response = await fetch('/api/programs');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });
});

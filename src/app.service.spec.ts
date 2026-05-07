import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it('returns the API health status', () => {
    const response = service.getHealth();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('boxful-api');
    expect(typeof response.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});

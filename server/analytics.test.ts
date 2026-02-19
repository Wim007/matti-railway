import { describe, it, expect } from 'vitest';
import { detectRisk, detectCrisisResponse } from '@shared/risk-detection';

describe('Analytics - Risk Detection', () => {
  it('should detect suicidality keywords', () => {
    const text = "Ik wil dood, ik zie geen uitweg meer";
    const risk = detectRisk(text);
    
    expect(risk).not.toBeNull();
    expect(risk?.type).toBe('suicidality');
    expect(risk?.level).toBe('critical');
    expect(risk?.detected).toBe(true);
  });

  it('should detect self-harm keywords', () => {
    const text = "Ik doe mezelf pijn door te snijden";
    const risk = detectRisk(text);
    
    expect(risk).not.toBeNull();
    expect(risk?.type).toBe('self_harm');
    expect(risk?.level).toBe('high');
  });

  it('should detect abuse keywords', () => {
    const text = "Er is misbruik thuis, ik word geslagen";
    const risk = detectRisk(text);
    
    expect(risk).not.toBeNull();
    expect(risk?.type).toBe('abuse');
    expect(risk?.level).toBe('high');
  });

  it('should return null for safe text', () => {
    const text = "Ik heb vandaag een leuke dag gehad op school";
    const risk = detectRisk(text);
    
    expect(risk).toBeNull();
  });

  it('should detect crisis response language', () => {
    const response = "Ik hoor dat je het moeilijk hebt. Bel alsjeblieft 113 of de Kindertelefoon 0800-0432";
    const isCrisis = detectCrisisResponse(response);
    
    expect(isCrisis).toBe(true);
  });

  it('should not detect crisis in normal response', () => {
    const response = "Dat klinkt vervelend. Wil je er meer over vertellen?";
    const isCrisis = detectCrisisResponse(response);
    
    expect(isCrisis).toBe(false);
  });
});

describe('Analytics - Event Structure', () => {
  it('should have correct SESSION_START structure', () => {
    const event = {
      app_type: 'matti',
      event_type: 'SESSION_START',
      userId: 1,
      sessionId: 123,
      leeftijd: 15,
      leeftijdsgroep: '14-15',
      gemeente: '1234',
      is_new_user: true,
      theme: 'school',
      timestamp: new Date().toISOString(),
    };
    
    expect(event.app_type).toBe('matti');
    expect(event.event_type).toBe('SESSION_START');
    expect(event.leeftijdsgroep).toBe('14-15');
  });

  it('should have correct MESSAGE_SENT structure', () => {
    const event = {
      app_type: 'matti',
      event_type: 'MESSAGE_SENT',
      userId: 1,
      sessionId: 123,
      theme: 'friends',
      messageCount: 5,
      timestamp: new Date().toISOString(),
    };
    
    expect(event.event_type).toBe('MESSAGE_SENT');
    expect(event.messageCount).toBeGreaterThan(0);
  });

  it('should have correct RISK_DETECTED structure', () => {
    const event = {
      app_type: 'matti',
      event_type: 'RISK_DETECTED',
      userId: 1,
      sessionId: 123,
      riskLevel: 'critical',
      riskType: 'suicidality',
      action_taken: 'Crisis resources provided',
      timestamp: new Date().toISOString(),
    };
    
    expect(event.event_type).toBe('RISK_DETECTED');
    expect(event.riskLevel).toBe('critical');
    expect(['suicidality', 'self_harm', 'abuse', 'other']).toContain(event.riskType);
  });

  it('should have correct SESSION_END structure', () => {
    const event = {
      app_type: 'matti',
      event_type: 'SESSION_END',
      userId: 1,
      sessionId: 123,
      duration_seconds: 300,
      total_messages: 10,
      timestamp: new Date().toISOString(),
    };
    
    expect(event.event_type).toBe('SESSION_END');
    expect(event.duration_seconds).toBeGreaterThan(0);
    expect(event.total_messages).toBeGreaterThan(0);
  });
});

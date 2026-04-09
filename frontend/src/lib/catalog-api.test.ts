import { describe, expect, it, vi, beforeEach } from 'vitest';
import { callAuthMutation } from './catalog-api';
import { callGraphql } from '../features/catalog/api/graphql';

vi.mock('../features/catalog/api/graphql', () => ({
  callGraphql: vi.fn(),
}));

const mockedCallGraphql = vi.mocked(callGraphql);

describe('catalog-api utilities', () => {
  beforeEach(() => {
    mockedCallGraphql.mockReset();
  });

  it('returns a token when the login mutation succeeds', async () => {
    mockedCallGraphql.mockResolvedValue({
      data: { login: { accessToken: 'token-123' } },
      error: undefined,
    });
    const result = await callAuthMutation('login', 'ego@example.com', 'P@ssword1!');
    expect(result).toEqual({ token: 'token-123' });
    expect(mockedCallGraphql).toHaveBeenCalledWith(
      expect.stringContaining('mutation login'),
      expect.objectContaining({ input: { email: 'ego@example.com', password: 'P@ssword1!' } }),
      undefined,
    );
  });

  it('reports an error when the service returns an error', async () => {
    mockedCallGraphql.mockResolvedValue({
      error: 'GraphQL failure',
    });
    const result = await callAuthMutation('signup', 'sign@example.com', 'Secret', '+1');
    expect(result).toEqual({ error: 'GraphQL failure' });
  });

  it('returns an error when the response lacks a token', async () => {
    mockedCallGraphql.mockResolvedValue({
      data: { login: undefined },
    });
    const result = await callAuthMutation('login', 'no-token@example.com', 'pass');
    expect(result.error).toBe('No token returned from server');
  });
});

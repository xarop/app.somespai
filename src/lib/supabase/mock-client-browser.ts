export function createMockClient(isBrowser: boolean) {
  return new MockClient() as any;
}

class MockClient {
  auth = {
    getUser: async () => {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'seed@somespai.cat',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
      };
      return { data: { user: mockUser }, error: null };
    },
    getSession: async () => {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'seed@somespai.cat',
      };
      return {
        data: {
          session: {
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-token',
          },
        },
        error: null,
      };
    },
    onAuthStateChange: (callback: any) => {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'seed@somespai.cat',
      };
      setTimeout(() => {
        try {
          callback('SIGNED_IN', { user: mockUser, access_token: 'mock-token', refresh_token: 'mock-token' });
        } catch (e) {
          // ignore
        }
      }, 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  };

  storage = {
    from: (bucket: string) => {
      return {
        upload: async (path: string, file: any) => {
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => {
          return { data: { publicUrl: `/mock-photos/${path}` } };
        },
        remove: async (paths: string[]) => {
          return { data: paths, error: null };
        },
      };
    },
  };

  from(table: string) {
    return new MockQueryBuilder(table);
  }

  async rpc(name: string, args: any = {}) {
    const payload = {
      table: 'rpc',
      rpcName: name,
      rpcArgs: args,
    };

    const res = await fetch('/api/mock-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }
}

class MockQueryBuilder {
  private table: string;
  private filters: any[] = [];
  private orderCol?: string;
  private orderAsc = true;
  private limitCount?: number;
  private isSingle = false;
  private isMaybeSingle = false;
  private updateData?: any;
  private insertData?: any;
  private isDelete = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields = '*') {
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ type: 'eq', col, val });
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push({ type: 'neq', col, val });
    return this;
  }

  in(col: string, vals: any[]) {
    this.filters.push({ type: 'in', col, vals });
    return this;
  }

  is(col: string, val: any) {
    this.filters.push({ type: 'is', col, val });
    return this;
  }

  not(col: string, op: string, val: any) {
    this.filters.push({ type: 'not', col, op, val });
    return this;
  }

  order(col: string, { ascending = true } = {}) {
    this.orderCol = col;
    this.orderAsc = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  upsert(data: any, options: any = {}) {
    this.insertData = data;
    return this;
  }

  async insert(data: any) {
    this.insertData = data;
    return this;
  }

  async update(data: any) {
    this.updateData = data;
    return this;
  }

  async delete() {
    this.isDelete = true;
    return this;
  }

  async then(resolve: any, reject: any) {
    try {
      const res = await this.execute();
      resolve(res);
    } catch (err) {
      if (reject) reject(err);
    }
  }

  private async execute() {
    const payload = {
      table: this.table,
      filters: this.filters,
      orderCol: this.orderCol,
      orderAsc: this.orderAsc,
      limitCount: this.limitCount,
      isSingle: this.isSingle,
      isMaybeSingle: this.isMaybeSingle,
      updateData: this.updateData,
      insertData: this.insertData,
      isDelete: this.isDelete,
    };

    const res = await fetch('/api/mock-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }
}

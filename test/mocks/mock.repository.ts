export class MockRepository {
  create = jest.fn();
  save = jest.fn();
  findOne = jest.fn();
  find = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  createQueryBuilder = jest.fn();
}

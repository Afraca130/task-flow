import { User } from "@/users/entities/user.entity";


/**
 * 사용자 리포지토리 포트
 */
export interface UserRepositoryPort {
  /**
   * 사용자 생성
   */
  create(userData: Partial<User>): Promise<User>;

  /**
   * ID로 사용자 조회
   */
  findById(id: string): Promise<User | null>;

  /**
   * 이메일로 사용자 조회
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * 사용자 정보 업데이트
   */
  update(id: string, userData: Partial<User>): Promise<User>;

  /**
   * 사용자 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 사용자 존재 여부 확인
   */
  exists(id: string): Promise<boolean>;

  /**
   * 이메일 중복 확인
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * 활성 사용자 목록 조회
   */
  findActiveUsers(): Promise<User[]>;

  /**
   * 비밀번호 업데이트
   */
  updatePassword(id: string, hashedPassword: string): Promise<void>;

  /**
   * 마지막 로그인 시간 업데이트
   */
  updateLastLoginAt(id: string): Promise<void>;
}

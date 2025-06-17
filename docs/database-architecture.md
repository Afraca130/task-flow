erDiagram
User ||--o{ ProjectMember : "사용자-프로젝트멤버 관계"
Project ||--o{ ProjectMember : "프로젝트-프로젝트멤버"
User ||--o{ Task : "할당자 관계"
User ||--o{ Task : "피할당자 관계"
Project ||--o{ Task : "프로젝트-업무"
Task ||--o{ Comment : "업무-댓글"
User ||--o{ Comment : "사용자-댓글"
User ||--o{ ActivityLog : "사용자-활동로그"
Project ||--o{ ActivityLog : "프로젝트-활동로그"
User ||--o{ Notification : "사용자-알림"
Task ||--o{ Notification : "업무-알림"
Project ||--o{ ProjectInvitation : "프로젝트-초대"
User ||--o{ ProjectInvitation : "초대자-초대"
User ||--o{ ProjectInvitation : "피초대자-초대"
Comment ||--o{ Comment : "부모댓글-답글"

    User {
        UUID id PK
        string email UK
        string password
        string name
        Date createdAt
        Date updatedAt
        boolean isActive "계정 활성화 상태"
        string profileImage "프로필 이미지"
    }

    Project {
        UUID id PK
        string name
        string description
        UUID ownerId FK "프로젝트 소유자 ID"
        enum status "상태: ACTIVE, COMPLETED, ARCHIVED"
        boolean isPublic "공개 여부"
        Date startDate
        Date endDate
        UUID createdBy FK "생성자 ID"
        Date createdAt "생성일"
        Date updatedAt "수정일"
        string inviteCode "초대 코드"
        enum approvalType "승인 방식: AUTO, MANUAL"
    }

    ProjectMember {
        UUID id PK
        UUID projectId FK
        UUID userId FK "사용자 ID"
        enum role "역할: OWNER, MANAGER, MEMBER"
        Date joinedAt
        UUID invitedBy FK
        boolean isActive "멤버 활성화 상태"
    }

    Task {
        UUID id PK
        string title
        string description
        enum status "상태: PENDING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED"
        enum priority "우선순위: LOW, MEDIUM, HIGH, URGENT"
        UUID assigneeId FK "피할당자 ID"
        UUID assignerId FK "할당자 ID"
        UUID projectId FK "프로젝트 ID"
        Date dueDate "마감일"
        Date createdAt "생성일"
        Date updatedAt "수정일"
        number estimatedHours "예상 소요시간"
        number actualHours "실제 소요시간"
    }

    Comment {
        UUID id PK
        string content
        UUID taskId FK
        UUID userId FK "작성자 ID"
        UUID parentId FK "부모 댓글 ID (답글용)"
        Date createdAt
        Date updatedAt "수정일"
        boolean isDeleted "삭제 여부"
    }

    ActivityLog {
        UUID id PK
        UUID userId FK
        UUID projectId FK "프로젝트 ID"
        UUID entityId FK "대상 엔터티 ID"
        string entityType "대상 엔터티 타입: Task, Project, User"
        enum action "액션: CREATE, UPDATE, DELETE, COMMENT"
        string description "상세 설명"
        Date timestamp
        json metadata "추가 메타데이터"
    }

    Notification {
        UUID id PK
        UUID userId FK
        UUID taskId FK "관련 업무 ID"
        UUID projectId FK "관련 프로젝트 ID"
        enum type "알림 타입: TASK_ASSIGNED, COMMENT_ADDED, PROJECT_INVITED, etc"
        string title
        string message
        boolean isRead
        Date createdAt
        Date readAt "읽은 시간"
    }

    ProjectInvitation {
        UUID id PK "프로젝트 초대 엔터티"
        UUID projectId FK
        UUID inviterId FK
        UUID inviteeId FK
        enum status "상태: PENDING, ACCEPTED, REJECTED, EXPIRED"
        string inviteToken
        Date expiresAt
        Date createdAt
        Date respondedAt
    }

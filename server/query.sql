-- name: CreateUser :exec
INSERT INTO users (username, email, password, verification_token, is_verified) 
VALUES ($1, $2, $3, $4, $5);

-- name: VerifyUser :one
UPDATE users SET is_verified = TRUE, verification_token = NULL 
WHERE verification_token = $1 
RETURNING username;

-- name: GetUserByUsername :one
SELECT username, email, password, is_verified 
FROM users 
WHERE username = $1;

-- name: GetUserByEmail :one
SELECT username, is_verified 
FROM users 
WHERE email = $1;

-- name: SetVerificationToken :exec
UPDATE users SET verification_token = $1 
WHERE email = $2;

-- name: SetPasswordResetToken :exec
UPDATE users SET reset_token = $1, reset_expiry = $2 
WHERE email = $3;

-- name: GetUserByResetToken :one
SELECT email, reset_expiry 
FROM users 
WHERE reset_token = $1;

-- name: UpdatePassword :exec
UPDATE users SET password = $1, reset_token = NULL, reset_expiry = NULL 
WHERE email = $2;

-- name: UpdateUser :exec
UPDATE users SET bio = $1, avatar = $2, links = $3, username = $4 
WHERE username = $5;

-- name: CheckUsernameExists :one
SELECT count(*) 
FROM users 
WHERE username = $1;

-- name: DeleteUser :exec
DELETE FROM users 
WHERE username = $1;

-- name: GetProfile :one
SELECT
    u.username, u.email, COALESCE(u.bio, '') as bio, COALESCE(u.avatar, '') as avatar, COALESCE(u.links, '') as links,
    (SELECT COUNT(*) FROM questions q WHERE q.author = u.username) as posted,
    (SELECT COUNT(*) FROM answers a WHERE a.author = u.username) as answered
FROM users u
WHERE u.username = $1;

-- name: GetPublicProfile :one
SELECT
    u.username, COALESCE(u.bio, '') as bio, COALESCE(u.avatar, '') as avatar, COALESCE(u.links, '') as links,
    (SELECT COUNT(*) FROM questions q WHERE q.author = u.username) as posted,
    (SELECT COUNT(*) FROM answers a WHERE a.author = u.username) as answered
FROM users u
WHERE u.username = $1;

-- name: GetQuestionVote :one
SELECT username, question_uid 
FROM question_upvotes 
WHERE username = $1 AND question_uid = $2;

-- name: CreateQuestionVote :exec
INSERT INTO question_upvotes (username, question_uid) 
VALUES ($1, $2);

-- name: DeleteQuestionVote :exec
DELETE FROM question_upvotes 
WHERE username = $1 AND question_uid = $2;

-- name: IncrementQuestionUpvotes :exec
UPDATE questions SET upvotes_count = upvotes_count + 1 
WHERE uid = $1;

-- name: DecrementQuestionUpvotes :exec
UPDATE questions SET upvotes_count = upvotes_count - 1 
WHERE uid = $1;

-- name: GetQuestionAuthor :one
SELECT author FROM questions WHERE uid = $1;

-- name: CheckNotificationExists :one
SELECT exists(
    SELECT 1 FROM notifications 
    WHERE type = $1 AND actor_username = $2 AND reference_uid = $3
);

-- name: CreateNotification :exec
INSERT INTO notifications (user_username, actor_username, type, reference_uid) 
VALUES ($1, $2, $3, $4);

-- name: GetQuestion :one
SELECT
    q.uid,
    q.content,
    q.time_created,
    q.author,
    u.avatar,
    q.upvotes_count as upvotes,
    exists (
        select 1 from question_upvotes v2
        where v2.question_uid = q.uid and v2.username = sqlc.arg('current_user')
    ) as is_upvoted,
    q.chamber_uid,
    coalesce(c.name, '') as chamber_name
FROM questions q
LEFT JOIN users u on u.username = q.author
LEFT JOIN chambers c ON c.uid = q.chamber_uid
WHERE q.uid = sqlc.arg('uid');

-- name: DeleteQuestion :exec
DELETE FROM questions 
WHERE uid = $1 AND author = $2;

-- name: CreateQuestion :exec
INSERT INTO questions (content, author, chamber_uid) 
VALUES ($1, $2, $3);

-- name: UpdateQuestion :one
UPDATE questions SET content = $1 
WHERE uid = $2 AND author = $3 
RETURNING uid;

-- name: ListQuestions :many
SELECT
    q.uid,
    q.content,
    q.time_created,
    q.author,
    u.avatar,
    q.upvotes_count as upvotes,
    exists (
        select 1 from question_upvotes v2
        where v2.question_uid = q.uid and v2.username = sqlc.arg('current_user')
    ) as is_upvoted,
    q.chamber_uid,
    coalesce(c.name, '') as chamber_name
FROM questions q
LEFT JOIN users u ON u.username = q.author
LEFT JOIN chambers c ON c.uid = q.chamber_uid
ORDER BY q.time_created DESC
LIMIT $1 OFFSET $2;

-- name: ListQuestionsByChamber :many
SELECT
    q.uid,
    q.content,
    q.time_created,
    q.author,
    u.avatar,
    q.upvotes_count as upvotes,
    exists (
        select 1 from question_upvotes v2
        where v2.question_uid = q.uid and v2.username = sqlc.arg('current_user')
    ) as is_upvoted,
    q.chamber_uid,
    coalesce(c.name, '') as chamber_name
FROM questions q
LEFT JOIN users u ON u.username = q.author
LEFT JOIN chambers c ON c.uid = q.chamber_uid
WHERE q.chamber_uid = sqlc.arg('chamber_uid')
ORDER BY q.time_created DESC
LIMIT $1 OFFSET $2;

-- name: ListQuestionsByAuthor :many
SELECT
    q.uid,
    q.content,
    q.time_created,
    q.author,
    u.avatar,
    q.upvotes_count as upvotes,
    exists (
        select 1 from question_upvotes v2
        where v2.question_uid = q.uid and v2.username = sqlc.arg('current_user')
    ) as is_upvoted,
    q.chamber_uid,
    coalesce(c.name, '') as chamber_name
FROM questions q
LEFT JOIN users u ON u.username = q.author
LEFT JOIN chambers c ON c.uid = q.chamber_uid
WHERE q.author = sqlc.arg('author')
ORDER BY q.time_created DESC
LIMIT $1 OFFSET $2;

-- name: ListQuestionsTop :many
SELECT
    q.uid,
    q.content,
    q.time_created,
    q.author,
    u.avatar,
    q.upvotes_count as upvotes,
    exists (
        select 1 from question_upvotes v2
        where v2.question_uid = q.uid and v2.username = sqlc.arg('current_user')
    ) as is_upvoted,
    q.chamber_uid,
    coalesce(c.name, '') as chamber_name
FROM questions q
LEFT JOIN users u ON u.username = q.author
LEFT JOIN chambers c ON c.uid = q.chamber_uid
ORDER BY q.upvotes_count DESC
LIMIT $1 OFFSET $2;

-- name: SearchQuestions :many
SELECT
    q.uid, q.content, q.time_created, q.author,
    u.avatar,
    q.upvotes_count,
    exists (select 1 from question_upvotes v2 where v2.question_uid = q.uid and v2.username = sqlc.arg('current_user')) as is_upvoted
FROM questions q
LEFT JOIN users u on u.username = q.author
WHERE q.content ilike sqlc.arg('query')
LIMIT $1 OFFSET $2;

-- name: ListReplies :many
SELECT 
    a.uid,
    a.content,
    a.time_created,
    a.question_uid,
    a.author,
    u.avatar,
    a.upvotes_count as upvotes,
    exists (
        select 1 from answer_upvotes v2
        where v2.answer_uid = a.uid and v2.username = sqlc.arg('current_user')
    ) as is_upvoted
FROM answers a
LEFT JOIN users u ON u.username = a.author
WHERE a.question_uid = $1
LIMIT 200 OFFSET 0;

-- name: CreateReply :exec
INSERT INTO answers (uid, content, question_uid, author, time_created) 
VALUES ($1, $2, $3, $4, $5);

-- name: UpdateReply :one
UPDATE answers SET content = $1 
WHERE uid = $2 AND author = $3 
RETURNING uid;

-- name: GetAnswerVote :one
SELECT answer_uid, username 
FROM answer_upvotes 
WHERE username = $1 AND answer_uid = $2;

-- name: CreateAnswerVote :exec
INSERT INTO answer_upvotes (answer_uid, username) 
VALUES ($1, $2);

-- name: DeleteAnswerVote :exec
DELETE FROM answer_upvotes 
WHERE username = $1 AND answer_uid = $2;

-- name: IncrementAnswerUpvotes :exec
UPDATE answers SET upvotes_count = upvotes_count + 1 
WHERE uid = $1;

-- name: DecrementAnswerUpvotes :exec
UPDATE answers SET upvotes_count = upvotes_count - 1 
WHERE uid = $1;

-- name: GetAnswerAuthor :one
SELECT author FROM answers WHERE uid = $1;

-- name: DeleteReply :exec
DELETE FROM answers 
WHERE uid = $1 AND question_uid = $2 AND author = $3;

-- name: CreateChamber :exec
INSERT INTO chambers (uid, name, description, creator_username, color_index) 
VALUES ($1, $2, $3, $4, $5);

-- name: AddChamberMember :exec
INSERT INTO chamber_members (chamber_uid, username) 
VALUES ($1, $2);

-- name: DeleteChamber :exec
DELETE FROM chambers 
WHERE creator_username = $1 AND name = $2;

-- name: ListChambers :many
SELECT 
    c.uid, 
    c.name, 
    COALESCE(c.description, '') as description, 
    c.color_index,
    c.created_at,
    (SELECT COUNT(*) FROM chamber_members cm WHERE cm.chamber_uid = c.uid) as member_count,
    EXISTS(SELECT 1 FROM chamber_members cm WHERE cm.chamber_uid = c.uid AND cm.username = sqlc.arg('current_user')) as is_joined
FROM chambers c
WHERE ($1::text IS NULL OR c.name ILIKE '%' || $1 || '%' OR c.description ILIKE '%' || $1 || '%');

-- name: JoinChamber :exec
INSERT INTO chamber_members (chamber_uid, username) 
VALUES ($1, $2) 
ON CONFLICT DO NOTHING;

-- name: LeaveChamber :exec
DELETE FROM chamber_members 
WHERE chamber_uid = $1 AND username = $2;

-- name: ListNotifications :many
SELECT
    n.uid,
    n.user_username,
    n.actor_username,
    n.type,
    n.reference_uid,
    n.is_read,
    n.created_at,
    u.avatar as actor_avatar,
    COALESCE(q.content, a.content, '') as content,
    COALESCE(q2.content, '') as question_content
FROM notifications n
LEFT JOIN users u ON n.actor_username = u.username
LEFT JOIN questions q ON n.type = 'upvote_question' AND n.reference_uid = q.uid
LEFT JOIN answers a ON n.reference_uid = a.uid AND (n.type = 'reply_question' OR n.type = 'upvote_reply')
LEFT JOIN questions q2 ON a.question_uid = q2.uid
WHERE n.user_username = $1
ORDER BY n.created_at DESC
LIMIT $2 OFFSET $3;

-- name: SearchChambers :many
SELECT 
    c.uid, c.name, COALESCE(c.description, '') as description, c.color_index, c.created_at,
    (SELECT COUNT(*) FROM chamber_members cm WHERE cm.chamber_uid = c.uid) as member_count,
    EXISTS(SELECT 1 FROM chamber_members cm WHERE cm.chamber_uid = c.uid AND cm.username = sqlc.arg('current_user')) as is_joined
FROM chambers c
WHERE c.name ILIKE '%' || sqlc.arg('query') || '%' OR c.description ILIKE '%' || sqlc.arg('query') || '%'
LIMIT 5;

-- name: SearchReplies :many
SELECT 
    a.uid, a.content, a.time_created, a.question_uid, a.author,
    u.avatar,
    a.upvotes_count,
    exists (select 1 from answer_upvotes v2 where v2.answer_uid = a.uid and v2.username = sqlc.arg('current_user')) as is_upvoted
FROM answers a
LEFT JOIN users u on u.username = a.author
WHERE a.content ilike '%' || sqlc.arg('query') || '%'
LIMIT 5;

-- name: SearchUsers :many
SELECT username, COALESCE(avatar, '') as avatar, COALESCE(bio, '') as bio
FROM users
WHERE username ILIKE '%' || sqlc.arg('query') || '%'
LIMIT 5;

-- name: ListQuestionsFiltered :many
SELECT
    q.uid,
    q.content,
    q.time_created,
    q.author,
    u.avatar,
    q.upvotes_count as upvotes,
    exists (
        select 1 from question_upvotes v2
        where v2.question_uid = q.uid and v2.username = sqlc.arg('current_user')
    ) as is_upvoted,
    q.chamber_uid,
    coalesce(c.name, '') as chamber_name
FROM questions q
LEFT JOIN users u ON u.username = q.author
LEFT JOIN chambers c ON c.uid = q.chamber_uid
LEFT JOIN chamber_members cm ON cm.chamber_uid = q.chamber_uid AND cm.username = sqlc.arg('current_user')
WHERE
    (sqlc.narg('target_chamber_uid')::uuid IS NULL OR q.chamber_uid = sqlc.narg('target_chamber_uid'))
    AND (sqlc.narg('author')::text IS NULL OR q.author = sqlc.narg('author'))
    AND (sqlc.narg('filter_joined')::boolean IS NULL OR (sqlc.narg('filter_joined') = TRUE AND cm.username IS NOT NULL))
ORDER BY
    CASE WHEN sqlc.arg('sort')::text = 'votes' THEN q.upvotes_count END DESC,
    q.time_created DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');
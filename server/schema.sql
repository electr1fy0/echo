-- Extensions
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

CREATE TABLE users (
    username text NOT NULL PRIMARY KEY,
    password text,
    email text NOT NULL UNIQUE,
    bio text DEFAULT 'Wanderer'::text,
    avatar text,
    answered integer DEFAULT 0,
    posted integer DEFAULT 0,
    verification_token text,
    is_verified boolean DEFAULT false,
    links text,
    reset_token text,
    reset_expiry timestamp without time zone
);

CREATE TABLE chambers (
    uid uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    creator_username text REFERENCES users(username) ON UPDATE CASCADE,
    created_at timestamp without time zone DEFAULT now(),
    color_index integer DEFAULT 0
);

CREATE TABLE chamber_members (
    chamber_uid uuid NOT NULL REFERENCES chambers(uid) ON DELETE CASCADE,
    username text NOT NULL REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE,
    joined_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (chamber_uid, username)
);

CREATE TABLE questions (
    uid uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    time_created timestamp without time zone DEFAULT now(),
    content text,
    author text NOT NULL REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE,
    chamber_uid uuid NOT NULL REFERENCES chambers(uid) ON DELETE CASCADE,
    upvotes_count integer DEFAULT 0,
    reddit_upvotes integer DEFAULT 0
);

CREATE TABLE answers (
    uid uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    content text NOT NULL,
    question_uid uuid NOT NULL REFERENCES questions(uid) ON DELETE CASCADE,
    time_created timestamp without time zone DEFAULT now(),
    author text NOT NULL REFERENCES users(username) ON UPDATE CASCADE,
    upvotes_count integer DEFAULT 0,
    reddit_upvotes integer DEFAULT 0
);

CREATE TABLE question_upvotes (
    username text NOT NULL REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE,
    question_uid uuid NOT NULL REFERENCES questions(uid) ON DELETE CASCADE,
    PRIMARY KEY (username, question_uid)
);

CREATE TABLE answer_upvotes (
    answer_uid uuid NOT NULL REFERENCES answers(uid) ON DELETE CASCADE,
    username text NOT NULL REFERENCES users(username) ON UPDATE CASCADE,
    PRIMARY KEY (answer_uid, username)
);

CREATE TABLE notifications (
    uid uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_username text NOT NULL REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE,
    actor_username text REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE,
    type text NOT NULL,
    reference_uid uuid NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);

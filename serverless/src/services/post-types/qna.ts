import type { PostTypeHandler } from "./handler";

export const qnaHandler: PostTypeHandler = {
  type: "qna",
  getCreateValues(body) {
    return {
      acceptsAnswers: body.acceptsAnswers ?? false,
      postType: "qna",
    };
  },
  getUpdateValues() {
    return {};
  },
  getMetadata() {
    return {};
  },
};

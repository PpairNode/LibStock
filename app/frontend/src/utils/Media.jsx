import { DEFAULT_NOT_IMAGE_PATH } from "./Const";
import { API_BASE_URL } from "../api/axiosConfig";

const getPublicImageUrl = (path) => {
  if (!path || path === "not-image.png") {
    return DEFAULT_NOT_IMAGE_PATH;
  }

  const filename = path.split("/").pop();
  return `${API_BASE_URL}/media/${filename}`;
};

export default getPublicImageUrl;

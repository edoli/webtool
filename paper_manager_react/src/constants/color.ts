export const tagColors = new Proxy([
    { bg: "#E3F2FD", text: "#1565C0" }, // 파랑
    { bg: "#E8F5E9", text: "#2E7D32" }, // 초록
    { bg: "#F3E5F5", text: "#6A1B9A" }, // 보라
    { bg: "#FFF3E0", text: "#E65100" }, // 주황
    { bg: "#FCE4EC", text: "#C2185B" }, // 분홍
    { bg: "#E0F2F1", text: "#00695C" }, // 청록
    { bg: "#FFFDE7", text: "#F9A825" }, // 노랑
    { bg: "#FFEBEE", text: "#C62828" }, // 빨강
    { bg: "#E8EAF6", text: "#283593" }, // 인디고
    { bg: "#FAFAFA", text: "#424242" }  // 회색
], {
    get(target, prop) {
        if (typeof prop === 'string') {
            const index = parseInt(prop);
            if (!isNaN(index)) {
                return target[index % target.length];
            }
        }
        return target[prop as any];
    }
});
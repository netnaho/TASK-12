import { toast as sonnerToast } from 'vue-sonner';
export function useToast() {
    const toast = {
        success(message, description) {
            sonnerToast.success(message, { description });
        },
        error(message, description) {
            sonnerToast.error(message, { description });
        },
        info(message, description) {
            sonnerToast.info(message, { description });
        },
        warning(message, description) {
            sonnerToast.warning(message, { description });
        },
    };
    return { toast };
}

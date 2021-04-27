import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@material-ui/core';

export interface QuestionSuggestionProps {
    suggestion: string | undefined;
    open: boolean;
    onClose: () => void;
}

const QuestionSuggestion = ({ suggestion, open, onClose }: QuestionSuggestionProps) => { 
    return (
        <Dialog
        fullWidth={true}
        maxWidth='sm'
        open={open}
        onClose={onClose}
        >
            <DialogTitle>Question Suggestion</DialogTitle>
            <DialogContent>
                <DialogContentText>{suggestion || "No suggestion at the moment!"}</DialogContentText>
                <DialogContentText style={{color: '#aaaaaa'}}>
                    <i>Suggestions refresh every minute</i>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
            </DialogActions>
        </Dialog>
    );
} 

export default QuestionSuggestion;
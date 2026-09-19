class HireFlowException(Exception):
    pass


class InvalidCredentials(HireFlowException):
    pass


class PasswordMismatchError(HireFlowException):
    pass


class OldPasswordMismatchError(HireFlowException):
    pass


class TokenNotRecognizedError(HireFlowException):
    pass


class InvalidTokenTypeError(HireFlowException):
    pass


class TokenExpiredError(HireFlowException):
    pass


class TokenNotFoundError(HireFlowException):
    pass


class OtherUserSessionError(HireFlowException):
    pass


class UserNotExistsError(HireFlowException):
    pass


class JobNotExistsError(HireFlowException):
    pass


class ActiveApplicationsExistsError(HireFlowException):
    pass


class SameStatusError(HireFlowException):
    pass


class CandidateNotExistsError(HireFlowException):
    pass


class JobNotOpenError(HireFlowException):
    pass


class RecruiterNotExistsError(HireFlowException):
    pass


class ApplicationAlreadyExistsError(HireFlowException):
    pass


class ApplicationNotExistsError(HireFlowException):
    pass


class ApplicationAlreadyRejectedError(HireFlowException):
    pass


class ApplicationAlreadyHiredError(HireFlowException):
    pass


class DuplicateStageError(HireFlowException):
    pass


class BackwardStageError(HireFlowException):
    pass


class SkippedStageError(HireFlowException):
    def __init__(self, next_valid_stage: str):
        self.next_valid_stage = next_valid_stage


class CandidateAlreadyExistsError(HireFlowException):
    pass


class EmailAlreadyExistsError(HireFlowException):
    pass


class PhoneAlreadyExistsError(HireFlowException):
    pass


class ResumeAlreadyExistsError(HireFlowException):
    pass


class MinGreaterThanMax(HireFlowException):
    pass


class LinkedInAlreadyExistsError(HireFlowException):
    pass


class RecruiterAlreadyExistsError(HireFlowException):
    pass


class ActiveJobExistsError(HireFlowException):
    pass


class UnscreenedApplicationError(HireFlowException):
    pass


class RejectedApplicationError(HireFlowException):
    pass


class ClosedApplicationError(HireFlowException):
    pass


class DuplicateRoundError(HireFlowException):
    pass


class InterviewDetailsNotExistsError(HireFlowException):
    pass


class InterviewAlreadyCompletedError(HireFlowException):
    pass


class InterviewAlreadyCancelledError(HireFlowException):
    pass


class FeedbackAlreadySubmittedError(HireFlowException):
    pass


class FeedbackEmptyError(HireFlowException):
    pass

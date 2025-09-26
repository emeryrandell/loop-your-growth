-- Add DELETE policy for user_challenges table so users can delete their own challenges
CREATE POLICY "Users can delete their own challenges" 
ON public.user_challenges 
FOR DELETE 
USING (user_id = auth.uid());
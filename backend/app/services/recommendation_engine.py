from app.services.optimization import analyze_resources


def generate_recommendations(resources):
    """Return AWS-specific optimization findings without inventing savings."""
    return analyze_resources(resources)

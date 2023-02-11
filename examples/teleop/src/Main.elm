port module Main exposing (main)

import Browser
import Html as H
import Html.Attributes as At
import Html.Events as Ev
import Json.Encode as E



-- PORTS


port sendBaseMoveStraight : E.Value -> Cmd msg


port recvGetPosition : (Int -> msg) -> Sub msg



-- PROGRAM


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { position = 0 }
    , Cmd.none
    )



-- MODEL


type alias Model =
    { position : Int }



-- UPDATE


type Msg
    = BaseMoveStraight
    | RecvGetPosition Int


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        BaseMoveStraight ->
            ( model, handleBaseMoveStraight )

        RecvGetPosition position ->
            ( { model | position = position }, Cmd.none )


handleBaseMoveStraight : Cmd none
handleBaseMoveStraight =
    sendBaseMoveStraight <|
        E.object
            [ ( "dist", E.int 100 )
            , ( "speed", E.int 100 )
            ]



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ recvGetPosition RecvGetPosition
        ]



-- VIEWS


view : Model -> H.Html Msg
view model =
    H.div
        [ -- flex
          At.style "display" "flex"
        , At.style "flex-direction" "column"
        , At.style "justify-content" "center"
        , At.style "align-items" "center"
        , At.style "height" "100vh"
        , At.style "row-gap" "0.5rem"

        -- no user selection
        , At.style "user-select" "none"
        ]
        [ H.div [] [ H.text "position" ]
        , H.div [] [ H.text <| String.fromInt model.position ]
        , H.button [ Ev.onClick BaseMoveStraight ] [ H.text "GO" ]
        ]

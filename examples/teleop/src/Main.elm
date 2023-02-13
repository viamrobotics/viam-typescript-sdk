port module Main exposing (main)

import Browser
import Html as H
import Html.Attributes as At
import Html.Events as Ev
import Json.Encode as E
import Keyboard
import Keyboard.Arrows



-- PORTS


port sendMotorGoFor : E.Value -> Cmd msg


port sendBaseMoveStraight : E.Value -> Cmd msg


port sendBaseSetPower : E.Value -> Cmd msg


port sendBaseStop : () -> Cmd msg


port sendGetPosition : () -> Cmd msg


port recvGetPosition : (Float -> msg) -> Sub msg



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
    ( { position = 0
      , keys = []
      }
    , sendGetPosition ()
    )



-- MODEL


type alias Model =
    { position : Float
    , keys : List Keyboard.Key
    }



-- UPDATE


type Msg
    = MotorGoFor
    | BaseMoveStraight
    | BaseSetPower
    | RecvGetPosition Float
    | KeyMsg Keyboard.Msg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        KeyMsg keyMsg ->
            let
                keys =
                    Keyboard.update keyMsg model.keys
            in
            ( { model | keys = keys }, handleBaseSetPower keys )

        MotorGoFor ->
            ( model, handleMotorGoFor )

        BaseMoveStraight ->
            ( model, handleBaseMoveStraight )

        BaseSetPower ->
            ( model, handleBaseSetPower [] )

        RecvGetPosition position ->
            ( { model | position = position }, Cmd.none )


handleMotorGoFor : Cmd none
handleMotorGoFor =
    sendMotorGoFor <|
        E.object
            [ ( "rpm", E.int 100 )
            , ( "revs", E.int 10 )
            ]


handleBaseMoveStraight : Cmd none
handleBaseMoveStraight =
    sendBaseMoveStraight <|
        E.object
            [ ( "dist", E.int 100 )
            , ( "speed", E.int 100 )
            ]


handleBaseSetPower : List Keyboard.Key -> Cmd none
handleBaseSetPower keys =
    let
        { x, y } =
            Keyboard.Arrows.wasd keys
    in
    if x == 0 && y == 0 then
        sendBaseStop ()

    else
        sendBaseSetPower <|
            E.object
                [ ( "linear", E.float <| 0.1 * toFloat y * defaultPower )
                , ( "angular", E.float <| 0.1 * toFloat -x * defaultPower )
                ]


defaultPower : number
defaultPower =
    50



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ recvGetPosition RecvGetPosition
        , Sub.map KeyMsg Keyboard.subscriptions
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
        , H.div [] [ H.text <| String.fromFloat model.position ]
        , H.button [ Ev.onClick MotorGoFor ] [ H.text "Motor : Go For" ]
        , H.button [ Ev.onClick BaseMoveStraight ] [ H.text "Base : Move Straight" ]
        , H.button [ Ev.onClick BaseSetPower ] [ H.text "Base : Go Forward" ]
        ]
